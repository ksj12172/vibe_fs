export default function ErrorSection({ message, onReset }) {
  return (
    <section className="error-section">
      <div className="error-message">
        <h3>⚠️ 오류 발생</h3>
        <p>{message}</p>
        {onReset && (
          <button
            onClick={onReset}
            className="get-data-btn"
            style={{ marginTop: '1rem' }}
          >
            다시 시작하기
          </button>
        )}
      </div>
    </section>
  );
}
