// /frontend/src/pages/StrategyPage.tsx

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../services/apiClient';

// Define types for our state
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// A simple component for a chat message
const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      margin: '8px 0'
    }}>
      <div style={{
        background: isUser ? '#007bff' : '#e9e9eb',
        color: isUser ? 'white' : 'black',
        padding: '10px 15px',
        borderRadius: '20px',
        maxWidth: '70%',
      }}>
        {message.content}
      </div>
    </div>
  );
};


const StrategyPage = () => {
  // Get campaignId from URL if it exists, e.g. /strategy/uuid-goes-here
  const { campaignId: existingCampaignId } = useParams();
  const navigate = useNavigate();

  const [campaignId, setCampaignId] = useState<string | null>(existingCampaignId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handler for the very first message to create the campaign
  const handleInitialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    const firstUserMessage = { role: 'user' as const, content: inputValue };
    setMessages([firstUserMessage]);

    try {
      // Create the campaign first
      const campaignResponse = await apiClient.post('/api/campaigns/strategize', {
        title: 'New Campaign Strategy', // Or get from another input
        brief: inputValue,
      });
      const newCampaignId = campaignResponse.data.campaign_id;
      setCampaignId(newCampaignId);
      navigate(`/strategy/${newCampaignId}`, { replace: true }); // Update URL

      // Now continue the chat to get the first AI response
      const chatResponse = await apiClient.post(`/api/campaigns/${newCampaignId}/chat`, {
        message: inputValue,
      });

      setMessages(prev => [...prev, { role: 'assistant' as const, content: chatResponse.data.reply }]);
    } catch (err) {
      toast.error('Failed to start conversation. Please try again.');
      setMessages([]); // Clear messages on failure
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  };

  // Handler for all subsequent messages
  const handleContinueSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !campaignId) return;

    const newUserMessage = { role: 'user' as const, content: inputValue };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiClient.post(`/api/campaigns/${campaignId}/chat`, {
        message: inputValue,
      });
      setMessages(prev => [...prev, { role: 'assistant' as const, content: response.data.reply }]);
    } catch (err) {
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => prev.slice(0, -1)); // Remove the user message on failure
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for the final approval
  const handleApprove = async () => {
    if (!campaignId) return;

    const approvalPromise = apiClient.post(`/api/campaigns/${campaignId}/approve`);

    toast.promise(approvalPromise, {
      loading: 'Finalizing strategy and creating plan...',
      success: (res) => {
        // Here you would navigate to the moodboard/canvas page
        navigate(`/campaign/${campaignId}`);
        return 'Strategy approved! Your campaign plan is ready.';
      },
      error: 'Failed to approve strategy. Please try again.',
    });
  };

  const isChatStarted = campaignId !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '90vh', maxWidth: '800px', margin: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
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