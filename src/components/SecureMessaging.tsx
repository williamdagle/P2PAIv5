import React, { useState } from 'react';
import { Send, Reply, Mail, MailOpen, AlertCircle } from 'lucide-react';
import Button from './Button';

interface Message {
  id: string;
  sender_id: string;
  sender_type: 'provider' | 'patient';
  recipient_id: string;
  recipient_type: 'provider' | 'patient';
  subject: string;
  message_body: string;
  is_read: boolean;
  read_at?: string;
  priority: 'normal' | 'urgent';
  parent_message_id?: string;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
  };
}

interface SecureMessagingProps {
  messages: Message[];
  currentUserId: string;
  currentUserType: 'provider' | 'patient';
  onSendMessage: (message: any) => void;
  onMarkAsRead: (messageId: string) => void;
}

const SecureMessaging: React.FC<SecureMessagingProps> = ({
  messages,
  currentUserId,
  currentUserType,
  onSendMessage,
  onMarkAsRead,
}) => {
  const [showCompose, setShowCompose] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    message_body: '',
    priority: 'normal' as 'normal' | 'urgent',
    recipient_id: '',
    recipient_type: 'provider' as 'provider' | 'patient',
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setFormData({
      subject: `Re: ${message.subject}`,
      message_body: '',
      priority: 'normal',
      recipient_id: message.sender_id,
      recipient_type: message.sender_type,
    });
    setShowCompose(true);
  };

  const handleCompose = () => {
    setReplyingTo(null);
    setFormData({
      subject: '',
      message_body: '',
      priority: 'normal',
      recipient_id: '',
      recipient_type: currentUserType === 'provider' ? 'patient' : 'provider',
    });
    setShowCompose(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage({
      ...formData,
      sender_id: currentUserId,
      sender_type: currentUserType,
      parent_message_id: replyingTo?.id || null,
    });
    setShowCompose(false);
    setReplyingTo(null);
    setFormData({
      subject: '',
      message_body: '',
      priority: 'normal',
      recipient_id: '',
      recipient_type: currentUserType === 'provider' ? 'patient' : 'provider',
    });
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read && message.recipient_id === currentUserId) {
      onMarkAsRead(message.id);
    }
  };

  const unreadCount = messages.filter(
    (m) => !m.is_read && m.recipient_id === currentUserId
  ).length;

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow">
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <Button onClick={handleCompose} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No messages</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleMessageClick(message)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                  } ${!message.is_read && message.recipient_id === currentUserId ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!message.is_read &&
                          message.recipient_id === currentUserId && (
                            <MailOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                        <h4
                          className={`text-sm truncate ${
                            !message.is_read && message.recipient_id === currentUserId
                              ? 'font-semibold text-gray-900'
                              : 'font-medium text-gray-700'
                          }`}
                        >
                          {message.subject}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {message.sender_type === 'patient'
                          ? message.patient
                            ? `${message.patient.first_name} ${message.patient.last_name}`
                            : 'Patient'
                          : 'Provider'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                    {message.priority === 'urgent' && (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {showCompose ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {replyingTo ? 'Reply to Message' : 'New Message'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4">
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="urgent"
                      checked={formData.priority === 'urgent'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.checked ? 'urgent' : 'normal',
                        })
                      }
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label htmlFor="urgent" className="text-sm text-gray-700">
                      Mark as Urgent
                    </label>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={formData.message_body}
                    onChange={(e) =>
                      setFormData({ ...formData, message_body: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCompose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        ) : selectedMessage ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {selectedMessage.subject}
                  </h3>
                  <p className="text-sm text-gray-600">
                    From:{' '}
                    {selectedMessage.sender_type === 'patient'
                      ? selectedMessage.patient
                        ? `${selectedMessage.patient.first_name} ${selectedMessage.patient.last_name}`
                        : 'Patient'
                      : 'Provider'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(selectedMessage.created_at)}
                  </p>
                </div>
                {selectedMessage.priority === 'urgent' && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Urgent
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedMessage.message_body}
              </p>
            </div>

            <div className="p-4 border-t border-gray-200">
              <Button onClick={() => handleReply(selectedMessage)}>
                <Reply className="w-4 h-4 mr-2" />
                Reply
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-3 text-gray-400" />
              <p>Select a message to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecureMessaging;
