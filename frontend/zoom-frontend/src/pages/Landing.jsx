import React from "react";
import "../App.css";
import { Link } from "react-router-dom";
export default function LandingPage() {
  return (
    <div className="loadingContainer">
      <nav>
        <div className="navHeader">
          <h2>IN-VIDEO Call</h2>
        </div>
      </nav>

      <div className="loadingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#0c5ef8" }}>Connect</span> with IN-Video
          </h1>
          <p>Make call more real and connecting</p>
          <div role="button">
            <Link to={"/auth"}>Get Started</Link>
          </div>
        </div>
        <div>
          <img src="./mobile.png" alt="mobile" />
        </div>
      </div>
    </div>
  );
}
