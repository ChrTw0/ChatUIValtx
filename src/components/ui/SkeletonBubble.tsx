import './SkeletonBubble.styles.css';

export function SkeletonBubble() {
  return (
    <div className="SkeletonBubble">
      <div className="SkeletonBubble-line SkeletonBubble-line--long" />
      <div className="SkeletonBubble-line SkeletonBubble-line--mid" />
      <div className="SkeletonBubble-line SkeletonBubble-line--short" />
    </div>
  );
}
