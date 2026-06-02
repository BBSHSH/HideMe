import CollectionGrid from "../components/file/CollectionGrid";
import FileHeader from "../components/file/FileHeader";
import FileSidebar from "../components/file/FileSidebar";
import RecentActivity from "../components/file/RecentActivity";
import StorageStats from "../components/file/StorageStats";
import VaultStatusToast from "../components/file/VaultStatusToast";

export default function File() {
  return (
    <div
      style={{
        fontFamily: "'Manrope', sans-serif",
        background: "#12131b",
        backgroundImage: "radial-gradient(circle at 2px 2px, rgba(88,101,242,0.05) 1px, transparent 0)",
        backgroundSize: "32px 32px",
        color: "#e3e1ed",
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
        <FileSidebar />

        <main
          style={{
            marginLeft: 288,
            flex: 1,
            padding: 64,
            display: "flex",
            flexDirection: "column",
            gap: 64,
          }}
        >
          <FileHeader />
          <StorageStats />
          <CollectionGrid />
          <RecentActivity />
        </main>
      </div>

      <VaultStatusToast />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        input::placeholder { color: #8f8fa0; }
      `}</style>
    </div>
  );
}
