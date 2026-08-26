import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle2, CircleOff, Instagram, Link2, LogOut, RefreshCw } from 'lucide-react';
import { getCampaignById } from '../services/api/campaignApi';
import { connectInstagram, disconnectInstagram, getInstagramConnection } from '../services/api/socialApi';

interface CreativeApprovalRecord {
  platform: string;
  contentType: string;
  prompt: string;
  status: 'accepted' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
}

interface CampaignRecord {
  _id: string;
  title: string;
  companyName: string;
  campaignSummary?: string;
  description?: string;
  imagePrompts?: string[];
  imageApprovals?: CreativeApprovalRecord[];
}

interface InstagramConnection {
  platform: 'instagram';
  instagramAccountId: string;
  username: string;
  tokenExpiresAt?: string | null;
  connectionStatus: 'connected' | 'disconnected';
  pageId?: string | null;
}

const StatusPill = ({ connected }: { connected: boolean }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
      connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
    }`}
  >
    <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    {connected ? 'Connected' : 'Disconnected'}
  </span>
);

const CreativeCard = ({ creative }: { creative: CreativeApprovalRecord }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {creative.platform} - {creative.contentType}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-800">{creative.prompt}</p>
      </div>
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
        Accepted
      </span>
    </div>
  </div>
);

const AutopostPage = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [connection, setConnection] = useState<InstagramConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const instagramStatus = searchParams.get('instagram');
    const message = searchParams.get('message');

    if (instagramStatus === 'connected') {
      toast.success('Instagram connected successfully.');
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('instagram');
      nextParams.delete('message');
      setSearchParams(nextParams, { replace: true });
    } else if (instagramStatus === 'error') {
      toast.error(message || 'Instagram connection failed.');
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('instagram');
      nextParams.delete('message');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const loadData = async () => {
      if (!campaignId) {
        setIsLoading(false);
        return;
      }

      try {
        const [campaignResponse, connectionResponse] = await Promise.all([
          getCampaignById(campaignId),
          getInstagramConnection(),
        ]);

        setCampaign(campaignResponse.data ?? null);
        setConnection(connectionResponse.data ?? null);
      } catch (_error) {
        toast.error('Could not load autoposting details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [campaignId]);

  const acceptedCreatives = (campaign?.imageApprovals || []).filter((creative) => creative.status === 'accepted');
  const isConnected = connection?.connectionStatus === 'connected' && Boolean(connection?.username);

  const handleConnectInstagram = async () => {
    if (!campaignId) {
      toast.error('Missing campaign id.');
      return;
    }

    setIsConnecting(true);

    try {
      const response = await connectInstagram(campaignId);
      const authorizationUrl = response.data?.authorizationUrl;

      if (!authorizationUrl) {
        throw new Error('Instagram authorization URL was not returned.');
      }

      window.location.assign(authorizationUrl);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to start Instagram connection.');
      setIsConnecting(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    setIsDisconnecting(true);

    try {
      const response = await disconnectInstagram();
      setConnection(response.data ?? null);
      toast.success('Instagram account disconnected.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to disconnect Instagram.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,253,245,0.95),_white_44%,_#f8fafc_100%)] px-4 py-8 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Autoposting</p>
          <p className="mt-3 text-slate-700">Loading campaign and Instagram connection...</p>
        </div>
      </div>
    );
  }

  if (!campaignId || !campaign) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,253,245,0.95),_white_44%,_#f8fafc_100%)] px-4 py-8 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mb-6 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Autoposting</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Campaign not available</h1>
          <p className="mt-3 text-sm text-slate-600">We could not load this campaign.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,253,245,0.95),_white_44%,_#f8fafc_100%)] px-4 py-6 font-sans sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(`/images/${campaignId}`)}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Creative Review
          </button>
          <StatusPill connected={Boolean(isConnected)} />
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="border-b border-slate-100 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-800 p-6 text-white sm:p-8 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200"></p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{campaign.title || 'Untitled campaign'}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Connect the Instagram account for this campaign before we unlock posting and scheduling in later stages.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Campaign</p>
                  <p className="mt-2 text-base font-semibold">{campaign.companyName || 'Unknown Company'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Accepted creatives</p>
                  <p className="mt-2 text-base font-semibold">{acceptedCreatives.length}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleConnectInstagram}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isConnecting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
                  Connect Instagram
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectInstagram}
                  disabled={!isConnected || isDisconnecting}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            </section>

            <section className="space-y-6 p-6 sm:p-8">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Instagram account status</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {isConnected
                        ? 'This campaign is linked to a live Instagram professional account.'
                        : 'Connect an Instagram professional account to continue.'}
                    </p>
                  </div>
                  {isConnected ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <CircleOff className="h-6 w-6 text-slate-400" />}
                </div>

                <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                  {isConnected ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connected account</p>
                      <p className="text-lg font-semibold text-slate-900">@{connection?.username}</p>
                      <p className="text-sm text-slate-600">Instagram account ID: {connection?.instagramAccountId}</p>
                      {connection?.tokenExpiresAt && (
                        <p className="text-sm text-slate-500">
                          Token expires {new Date(connection.tokenExpiresAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">No account connected</p>
                      <p className="text-sm text-slate-600">
                        Click <span className="font-semibold text-slate-900">Connect Instagram</span> to start Meta OAuth.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-900">Accepted creatives</h2>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  These are the approved creatives that will be available once autoposting is implemented.
                </p>

                <div className="mt-4 space-y-3">
                  {acceptedCreatives.length > 0 ? (
                    acceptedCreatives.map((creative) => (
                      <CreativeCard key={`${creative.platform}-${creative.contentType}-${creative.prompt}`} creative={creative} />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <p className="text-sm font-semibold text-slate-900">No accepted creatives yet.</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Return to the image review stage and approve at least one creative first.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutopostPage;
