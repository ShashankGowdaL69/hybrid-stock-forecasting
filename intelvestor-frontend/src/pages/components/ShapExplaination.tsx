import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ShapProps {
  shap: { feature: string; value: number }[];
  explanation: string;
}

const ShapExplanation: React.FC<ShapProps> = ({ shap, explanation }) => {
  const data = {
    labels: shap.map(s => s.feature),
    datasets: [
      {
        label: 'Feature Impact (SHAP Value)',
        data: shap.map(s => s.value),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }} className="mt-6">
      <h3 className="text-xl font-semibold mb-4 text-blue-400">Model Explanation (SHAP)</h3>
      <Bar data={data} options={{ indexAxis: 'y', responsive: true, plugins: { legend: { display: true, position: 'top' } } }} height={200} />
      <p className="mt-4 text-gray-300 p-4 bg-gray-800 rounded-lg shadow-inner italic">{explanation}</p>
    </motion.div>
  );
};

export default ShapExplanation;