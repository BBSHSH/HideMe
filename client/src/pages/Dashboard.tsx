import VaultStatus from "../features/dashboard/VaultStatus";
import StatsGrid from "../features/dashboard/StatsGrid";
import QuickActions from "../features/dashboard/QuickActions";
import RecentFiles from "../features/dashboard/RecentFiles";
import ActivityFeed from "../features/dashboard/ActivityFeed";

const Dashboard = () => {
  return (
    <div style={{ minHeight: "100vh" }}>
      <main
        style={{
          marginLeft: "256px",
          marginTop: "40px",
          padding: "32px",
          minHeight: "100vh",
        }}
      >
        <div style={{ display: "flex", gap: "32px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "32px" }}>
            <VaultStatus />
            <StatsGrid />
            <QuickActions />
            <RecentFiles />
          </div>
          <ActivityFeed />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;