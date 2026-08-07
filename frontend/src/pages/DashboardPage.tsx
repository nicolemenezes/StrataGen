import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserCircle2, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/AuthContext';
import { signOut } from '../services/api/authApi';
import { connectLinkedIn, connectInstagram, getSocialConnections } from '../services/api/socialApi';
import { getCampaigns } from '../services/api/campaignApi';

interface CampaignSummary {
  _id: string;
  title: string;
  companyName: string;
  status: 'Draft' | 'Generating' | 'Ready' | 'Scheduled' | 'Published';
  createdAt: string;
}

interface SocialConnections {
  linkedin: boolean;
  instagram: boolean;
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const CampaignStatusBadge: React.FC<{ status: CampaignSummary['status'] }> = ({ status }) => {
  const statusStyles: Record<CampaignSummary['status'], { color: string }> = {
    Draft: { color: 'bg-gray-200 text-gray-800' },
    Generating: { color: 'bg-amber-200 text-amber-800' },
    Ready: { color: 'bg-blue-200 text-blue-800' },
    Scheduled: { color: 'bg-green-200 text-green-800' },
    Published: { color: 'bg-purple-200 text-purple-800' },
  };

  const { color } = statusStyles[status] || statusStyles.Draft;

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${color}`}>{status}</span>;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [socialConnections, setSocialConnections] = useState<SocialConnections>({
    linkedin: false,
    instagram: false,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const connections = await getSocialConnections();
        setSocialConnections(connections.data);
      } catch (_error) {
        toast.error('Could not load account data.');
      }
    };

    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const response = await getCampaigns();
        setCampaigns(response.data);
      } catch (_error) {
        toast.error('Failed to load your campaigns.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  const handleConnectLinkedIn = async () => {
    await connectLinkedIn();
    toast('LinkedIn connection will be available in a later phase.', { icon: 'i' });
  };

  const handleConnectInstagram = () => {
    connectInstagram();
    toast('Instagram connection will be available in a later phase.', { icon: 'i' });
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">Welcome, {user?.fullName || 'User'}</p>
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-50"
              aria-label="Open user menu"
            >
              <UserCircle2 className="h-6 w-6 text-gray-700" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-14 z-20 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'User'}</p>
                  <p className="break-all text-xs text-gray-500">{user?.email || 'No email available'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Social Integrations</h2>
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={handleConnectLinkedIn}
              disabled={socialConnections.linkedin}
              className="flex-1 rounded-md bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {socialConnections.linkedin ? 'Connected to LinkedIn' : 'Connect to LinkedIn'}
            </button>
            <button
              onClick={handleConnectInstagram}
              disabled={socialConnections.instagram}
              className="flex-1 rounded-md bg-pink-600 px-4 py-3 text-sm font-bold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
            >
              {socialConnections.instagram ? 'Connected to Instagram' : 'Connect to Instagram'}
            </button>
          </div>
          {!socialConnections.linkedin && (
            <p className="mt-3 text-xs text-gray-500">Connect your social accounts to enable auto-posting later.</p>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Campaigns</h2>
          <button
            onClick={() => navigate('/strategy')}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            New Strategy
          </button>
        </div>

        {campaigns.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((campaign) => (
              <button
                key={campaign._id}
                type="button"
                onClick={() => navigate(`/strategy/${campaign._id}`)}
                className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{campaign.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{campaign.companyName || 'Unknown Company'}</p>
                  </div>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Created {formatDate(campaign.createdAt)}</p>
                </div>
                <div className="mt-5 text-sm font-medium text-indigo-600 transition group-hover:translate-x-1">
                  Open strategy
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <h3 className="text-lg font-medium text-gray-800">No campaigns yet.</h3>
            <p className="mt-1 text-sm text-gray-500">Generate your first campaign to see it here.</p>
            <button
              onClick={() => navigate('/strategy')}
              className="mt-4 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Create New Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
