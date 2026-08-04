// /frontend/src/pages/StrategyPage.tsx
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getCampaignChat, strategizeAndChat, continueCampaignChat, approveCampaign } from '../services/api/campaignApi';

// Define types for our state
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// A simple component for a chat message, now with Markdown support
const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      margin: '8px 0',
    }}>
      <div className="chat-bubble" style={{ // Added a class for potential future styling
        background: isUser ? '#007bff' : '#e9e9eb',
        color: isUser ? 'white' : 'black',
        padding: '1px 15px',
        borderRadius: '20px',
        maxWidth: '90%',
        overflowX: 'auto',
      }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h3: ({node, ...props}) => <h3 style={{marginTop: 0, marginBottom: '8px'}} {...props} />,
            table: ({node, ...props}) => <table style={{borderCollapse: 'collapse', width: '100%', whiteSpace: 'nowrap'}} {...props} />,
            th: ({node, ...props}) => <th style={{border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left', backgroundColor: '#f8f8f8'}} {...props} />,
            td: ({node, ...props}) => <td style={{border: '1px solid #ccc', padding: '6px 10px'}} {...props} />,
            p: ({node, ...props}) => <p style={{margin: '8px 0'}} {...props} />,
            ul: ({node, ...props}) => <ul style={{paddingLeft: '20px'}} {...props} />,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};


const StrategyPage = () => {
  const { campaignId: existingCampaignId } = useParams();
  const navigate = useNavigate();

  const [campaignId, setCampaignId] = useState<string | null>(existingCampaignId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Effect to fetch chat history when the page loads with an existing campaign ID
  useEffect(() => {
    const fetchHistory = async () => {
      if (existingCampaignId) {
        try {
          const response = await getCampaignChat(existingCampaignId);
          setMessages(response.data);
        } catch (error) {
          toast.error("Could not load chat history.");
          navigate('/dashboard');
        }
      }
      setIsInitialLoading(false);
    };
    fetchHistory();
  }, [existingCampaignId, navigate]);

  // Effect to auto-scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /**
   * CORRECTED: Handles the very first message.
   * Calls the single '/strategize-and-chat' endpoint to create the campaign
   * and get the first AI response in one step.
   */
  const handleInitialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    const firstUserMessage = { role: 'user' as const, content: inputValue };
    setMessages([firstUserMessage]);
    setInputValue('');

    try {
      const response = await strategizeAndChat({
        title: 'New Campaign Strategy', // This could be taken from a form field in the future
        brief: inputValue,
      });

      const { campaign_id, initial_reply } = response.data;

      setCampaignId(campaign_id);
      navigate(`/strategy/${campaign_id}`, { replace: true }); // Update URL to include the new ID

      // Add the AI's first response to the chat
      setMessages(prev => [...prev, { role: 'assistant' as const, content: initial_reply }]);
    } catch (err) {
      toast.error('Failed to start conversation. Please try again.');
      setMessages([]); // Clear messages on failure
    } finally {
      setIsLoading(false);
    }
  };

  // Handles all subsequent messages in an existing chat
  const handleContinueSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !campaignId) return;

    const newUserMessage = { role: 'user' as const, content: inputValue };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await continueCampaignChat(campaignId, inputValue);
      setMessages(prev => [...prev, { role: 'assistant' as const, content: response.data.reply }]);
    } catch (err) {
      toast.error('Failed to get response.');
      setMessages(prev => prev.slice(0, -1)); // Remove the user message on failure
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handles the final approval of the strategy
  const handleApprove = async () => {
    if (!campaignId) return;
    const approvalPromise = approveCampaign(campaignId);
    toast.promise(approvalPromise, {
      loading: 'Finalizing strategy and creating plan...',
      success: () => {
        // Navigate to the campaign canvas page to see the results
        navigate(`/campaign/${campaignId}`);
        return 'Strategy approved! Your campaign plan is ready.';
      },
      error: 'Failed to approve strategy. Please try again.',
    });
  };

  const isChatStarted = campaignId !== null;

  if (isInitialLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading chat...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '90vh', maxWidth: '800px', margin: 'auto', border: '1px solid #ccc', borderRadius: '8px', background: 'white' }}>
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <ChatBubble key={index} message={msg} />
        ))}
         {isLoading && <ChatBubble message={{ role: 'assistant', content: '...' }} />}
        <div ref={chatEndRef} />
      </div>

      {isChatStarted && messages.length > 0 && (
         <div style={{ padding: '0 20px 10px', textAlign: 'center' }}>
            <button onClick={handleApprove} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
              Approve Strategy & Generate Plan
            </button>
          </div>
      )}

      <form onSubmit={isChatStarted ? handleContinueSubmit : handleInitialSubmit} style={{ padding: '20px', borderTop: '1px solid #ccc', display: 'flex' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isChatStarted ? "Refine your strategy..." : "Start by describing your campaign goal..."}
          style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc', marginRight: '10px' }}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default StrategyPage;