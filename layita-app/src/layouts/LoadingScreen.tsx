import flame from "../../public/favicon.svg";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <style>
        {`
          .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #f4f5f7;
            z-index: 9999;
          }
          .loading-text {
            margin-top: 1rem;
            font-family: sans-serif;
            font-weight: 500;
            color: #555;
          }
          @keyframes flicker {
                0%   { transform: scale(0.96) rotate(-1deg); opacity: 0.85; }
                25%  { transform: scale(1.02) rotate(1deg);  opacity: 1; }
                50%  { transform: scale(0.98) rotate(-0.5deg); }
                75%  { transform: scale(1.03) rotate(0.5deg); }
                100% { transform: scale(0.96) rotate(-1deg); opacity: 0.85; }
          }
          .loading-flame img {
            width: 80px;
            height: auto;
            transform-origin: bottom center; /* Keeps the base of the flame anchored */
            animation: flicker 0.9s infinite alternate ease-in-out;
          }
        `}
      </style>
        <div className="loading-flame">
            <img src={flame} alt="Loading..." />
        </div>
      <div className="loading-text">Loading…</div>
    </div>  
  );
}