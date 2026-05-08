export default function SuccessPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        fontFamily: "sans-serif",
      }}
    >
      <h1>🎉 Premium Activated</h1>
      <p>Your subscription is now active.</p>

      <a href="/">
        <button>Return Home</button>
      </a>
    </main>
  );
}