import Sidebar from "../components/Sidebar";

const Dashboard = () => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: 20, padding: 20 }}>
        <h1>Bienvenido al sistema</h1>
        <p>Contenido dinámico según rol</p>
      </div>
    </div>
  );
};

export default Dashboard;
