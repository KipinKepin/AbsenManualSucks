import React from "react";
import FormManualSucks from "./FormManualSucks";
import "./index.css";
import Footer from "./Footer";
const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <FormManualSucks />
      </main>
      <Footer />
    </div>
  );
};

export default App;
