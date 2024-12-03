import { BarChart, LogOut, Settings, User, Wallet } from "lucide-react";

const Navigation: React.FC<{ user: { name: string }; onLogout: () => void }> = ({user, onLogout}) => (
  <nav className="bg-white shadow-md">
    <div className="container mx-auto flex justify-between items-center p-4">
      <div className="flex items-center space-x-2">
        <Wallet className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-800">Expense Tracker</h1>
      </div>
      <div className="flex items-center space-x-4">
        <a
          href="#"
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <BarChart className="mr-2" size={20} /> Dashboard
        </a>
        <a
          href="#"
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <User className="mr-2" size={20} /> {user.name}
        </a>
        <a
          // href="#"
          className="flex items-center text-gray-600 hover:text-blue-600"
          onClick={() => onLogout()}
        >
          <LogOut className="mr-2" size={20} /> Logout
        </a>
      </div>
    </div>
  </nav>
);

export default Navigation;
