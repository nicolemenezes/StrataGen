import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserCircle2, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/AuthContext';
import { signOut } from '../services/api/authApi';
import { connectLinkedIn, connectInstagram, getSocialConnections } from '../services/api/socialApi';
import { getCampaigns, runCampaign } from '../services/api/campaignApi';

// --- 1. TYPE DEFINITIONS ---

// Represents a summary of a campaign for the dashboard list
interface CampaignSummary {
  id: string;
  title: string;
  status: 'Draft' | 'Generating' | 'Ready' | 'Scheduled' | 'Published';
  created_at: string;
}

// Represents the user's social media connection status
interface SocialConnections {
  linkedin: boolean;
  instagram: boolean;
}

// --- 2. HELPER FUNCTIONS & COMPONENTS ---

/**
 * A simple helper to format dates for display.
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',

  });
};

/**
 * Renders a colored badge based on the campaign's status.
 */
const CampaignStatusBadge: React.FC<{ status: CampaignSummary['status'] }> = ({ status }) => {
  const statusStyles = {
    Draft: { text: 'Draft', color: 'bg-gray-200 text-gray-800' },
    Generating: { text: 'Generating', color: 'bg-amber-200 text-amber-800' },
    Ready: { text: 'Ready', color: 'bg-blue-200 text-blue-800' },
    Scheduled: { text: 'Scheduled', color: 'bg-green-200 text-green-800' },
    Published: { text: 'Published', color: 'bg-purple-200 text-purple-800' },
  };

  const { text, color } = statusStyles[status] || statusStyles.Draft;

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${color}`}>
      {text}
    </span>
  );
};


// --- 3. MAIN DASHBOARD PAGE COMPONENT ---

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // In a real app, this would be fetched from your database
  const [socialConnections, setSocialConnections] = useState<SocialConnections>({
    linkedin: false,
    instagram: false,
  });

  // --- Data Fetching and Initialization ---

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const connections = await getSocialConnections();
        setSocialConnections(connections.data);
      } catch (error) {
        toast.error('Could not load account data.');
      }
    };

    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const response = await getCampaigns();
        // Sort campaigns by most recently created
        const sortedCampaigns = response.data.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setCampaigns(sortedCampaigns);
      } catch (error) {
        toast.error("Failed to load your campaigns.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    fetchCampaigns();
  }, [navigate]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // --- Event Handlers ---

  const handleLogout = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  const handleConnectLinkedIn = async () => {
    await connectLinkedIn();
    toast('LinkedIn connection will be available in a later phase.', { icon: 'ℹ️' });
  };

  /**
   * NOTE: Instagram (Facebook Graph API) requires a custom backend flow.
   * This function is a placeholder for that interaction.
   */
  const handleConnectInstagram = () => {
    connectInstagram();
    toast('Instagram connection will be available in a later phase.', { icon: 'ℹ️' });
  };

  /**
   * This function calls the backend to change the campaign status and queue all
   * associated posts for automatic execution by a backend worker.
   */
  const handleRunCampaign = async (campaignId: string) => {
    const confirmation = window.confirm("Are you sure you want to run this campaign? This will schedule all content for auto-posting.");
    if (!confirmation) return;

    try {
      toast.loading('Starting campaign...', { id: 'run-campaign' });
      await runCampaign(campaignId);
      
      toast.success('Campaign is now in progress! Posts are being scheduled.', { id: 'run-campaign' });
      
      // Refresh the campaign list to show the new status
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'Generating' } : c));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start campaign.', { id: 'run-campaign' });
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return <div className="p-8 text-center">Loading Dashboard...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* --- Header --- */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.fullName || 'User'}</p>
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
                  <p className="text-xs text-gray-500 break-all">{user?.email || 'No email available'}</p>
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

        {/* --- Integrations Panel --- */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-xl font-semibold mb-4">Social Integrations</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleConnectLinkedIn}
              disabled={socialConnections.linkedin}
              className="flex-1 px-4 py-3 text-sm font-bold text-white bg-blue-700 rounded-md disabled:bg-blue-300 hover:bg-blue-800 disabled:cursor-not-allowed"
            >
              {socialConnections.linkedin ? '✓ Connected to LinkedIn' : 'Connect to LinkedIn'}
            </button>
            <button 
              onClick={handleConnectInstagram}
              disabled={socialConnections.instagram}
              className="flex-1 px-4 py-3 text-sm font-bold text-white bg-pink-600 rounded-md disabled:bg-pink-300 hover:bg-pink-700 disabled:cursor-not-allowed"
            >
              {socialConnections.instagram ? '✓ Connected to Instagram' : 'Connect to Instagram'}
            </button>
          </div>
          {!socialConnections.linkedin && (
             <p className="text-xs text-gray-500 mt-3">Connect your social accounts to enable auto-posting.</p>
          )}
        </div>
        
        {/* --- Campaign List --- */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Campaigns</h2>
            <button
              onClick={() => navigate('/strategy')}
              className="ml-4 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
              aria-label="Create new strategy"
            >
              New Strategy
            </button>
          </div>
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            {campaigns.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {campaigns.map(campaign => (
                  <li key={campaign.id} className="p-4 sm:p-6 hover:bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-grow">
                      <p className="text-lg font-semibold text-gray-800">{campaign.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <CampaignStatusBadge status={campaign.status} />
                        <span className="text-xs text-gray-500">Created: {formatDate(campaign.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                      <button 
                         onClick={() => navigate(`/campaign/${campaign.id}`)}
                         className="flex-1 px-4 py-2 text-sm font-semibold bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                      >
                        View Canvas
                      </button>
                      {campaign.status === 'Ready' && (
                        <button 
                          onClick={() => handleRunCampaign(campaign.id)}
                          disabled={!socialConnections.linkedin} // Example: disable if not connected
                          className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Run Campaign
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-800">No campaigns yet!</h3>
                <p className="text-sm text-gray-500 mt-1">Get started by creating your first campaign.</p>
                <button
                  onClick={() => navigate('/strategy')}
                  className="mt-4 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
                >
                  Create New Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;