import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
        <header className="text-center">
          <img src={logo} className="w-24 h-24 mx-auto mb-4 animate-spin" alt="logo" />
          <p className="text-gray-700 mb-6">
            Edit <code className="bg-gray-100 px-2 py-1 rounded">src/App.js</code> and save to reload.
          </p>
          <a
            className="text-blue-500 hover:text-blue-700 font-semibold underline"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    </div>
  );
}

export default App;
