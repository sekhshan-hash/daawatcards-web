// Free-plan watermark: diagonal repeated text + bottom banner; never blocks taps, scratching or scrolling.
export const Watermark = () => (
  <div className="gc-watermark" aria-hidden="true" data-testid="card-watermark">
    <div className="gc-watermark-grid">
      {Array.from({ length: 28 }, (_, i) => <span key={i}>Made with Daawat</span>)}
    </div>
    <div className="gc-watermark-banner" data-testid="card-watermark-banner">Made with Daawat — remove watermark</div>
  </div>
);
