import React from "react";
import FormManualSucks from "./FormManualSucks";
import "./index.css";
import Footer from "./Footer";
const App = () => {
  return (
    <div className="flex flex-col justify-between min-h-screen">
      <FormManualSucks />
      <Footer />
    </div>
  );
};

export default App;
