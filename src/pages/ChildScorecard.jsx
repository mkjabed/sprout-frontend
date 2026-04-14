import { useParams } from "react-router-dom";

function ChildScorecard() {
  const { childId } = useParams();

  return (
    <main className="min-h-screen bg-[#D8F3DC] p-4 text-[#1B1B1B]">
      <div className="mx-auto max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#2D6A4F]">Scorecard</h1>
        <p className="mt-2 text-sm text-[#1B1B1B]/70">
          Child view for ID {childId} will be built in Step 7.
        </p>
      </div>
    </main>
  );
}

export default ChildScorecard;
