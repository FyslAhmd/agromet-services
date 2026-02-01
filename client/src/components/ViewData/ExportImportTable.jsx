import { motion } from "framer-motion";
import ActionButtons from "./ActionButtons";

const ExportImportTable = ({ data, formatNumber, onEdit, onDelete }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-gray-500">
        <p className="text-sm sm:text-base md:text-lg">No data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-lg rounded-lg">
      <table className="min-w-full bg-white border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs sm:text-sm font-semibold border-b-2 border-b-blue-800">
              Year
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-blue-800">
              Export Quantity (ton)
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-blue-800">
              Import Quantity (ton)
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-blue-800">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              } hover:bg-green-50 transition-colors duration-150`}
            >
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-900 border-b border-b-gray-200">
                {row.year}
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.exportQuantity)}
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.importQuantity)}
              </td>
              
              {/* Actions */}
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-center border-b border-b-gray-200">
                <ActionButtons row={row} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExportImportTable;
