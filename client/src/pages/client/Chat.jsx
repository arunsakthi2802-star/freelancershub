import ChatWindow from '../../components/chat/ChatWindow';

export default function ClientChat() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">Chat in real-time with freelancers regarding active applications or projects.</p>
      </div>
      <ChatWindow dashboardPrefix="/client" />
    </div>
  );
}
