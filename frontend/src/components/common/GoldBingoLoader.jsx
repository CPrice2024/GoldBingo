import logo from "../../assets/logo.png";
export default function GoldBingoLoader({
  text = "Loading...",
}) {
  return (
    <div
      className="gold-transition-loader"
      role="status"
      aria-live="polite"
    >
      <div className="gold-transition-glow" />

      <div className="gold-transition-content">

        <div className="gold-loader-logo-wrap">

          <span
            className="
              gold-loader-ring
              gold-loader-ring-one
            "
          />

          <span
            className="
              gold-loader-ring
              gold-loader-ring-two
            "
          />

          <div className="gold-loader-logo">
            <img
  src={logo}
  alt="GoldBingo Logo"
/>
          </div>

        </div>


        <div className="gold-loader-brand">
        </div>


        <p>
          {text}
        </p>


        <div className="gold-loader-progress">
          <span />
        </div>

      </div>
    </div>
  );
}