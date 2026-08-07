import { useNavigate, useParams } from 'react-router-dom';

const ImagesPage = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 font-sans sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <button
          type="button"
          onClick={() => navigate(`/strategy/${campaignId || ''}`)}
          className="mb-6 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          &larr; Back to Workspace
        </button>
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Next Phase</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Image generation placeholder</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Campaign images will be generated here in the next stage.
        </p>
      </div>
    </div>
  );
};

export default ImagesPage;
