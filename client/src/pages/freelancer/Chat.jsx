import ChatWindow from '../../components/chat/ChatWindow';

export default function FreelancerChat() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">Communicate with clients in real-time about active project contracts.</p>
      </div>
      <ChatWindow dashboardPrefix="/freelancer" />
    </div>
  );
}
