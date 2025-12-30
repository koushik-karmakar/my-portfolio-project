import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Todo from "./pages/Todo.jsx";
import Home from "./pages/Home.jsx";

import PrivateRoute from "./components/PrivateRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import WeatherApp from "./pages/Wheather-App.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Whisper_chat_app from "./pages/Whisper_chat_app.jsx";
import AddPhoneNumber from "./components/AddPhoneNumber.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<PrivateRoute />}>
          <Route path="/weather-app" element={<WeatherApp />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/whisper" element={<Whisper_chat_app />} />
          <Route path="/add-number" element={<AddPhoneNumber />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
