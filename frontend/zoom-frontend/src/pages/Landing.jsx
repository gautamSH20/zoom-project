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
        <div className="navList">
          <div className="nav1">Join as guest</div>
          <div className="nav2">Register</div>
          <div role="button">login</div>
        </div>
      </nav>

      <div className="loadingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#0c5ef8" }}>Connect</span> with IN-Video
          </h1>
          <p>Make call more real and connecting</p>
          <div role="button">
            <Link>Get Started</Link>
          </div>
        </div>
        <div>
          <img src="./mobile.png" alt="mobile" />
        </div>
      </div>
    </div>
  );
}
