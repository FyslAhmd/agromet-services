import { motion } from "framer-motion";
import ActionButtons from "./ActionButtons";

const DistrictWiseTable = ({ data, formatNumber, onEdit, onDelete }) => {
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
          <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs sm:text-sm font-semibold border-b-2 border-b-indigo-800">
              District
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-indigo-800">
              Year
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-indigo-800">
              Season
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-indigo-800">
              Area
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-indigo-800">
              Production
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-indigo-800">
              Yield
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-indigo-800">
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
              transition={{ delay: index * 0.02 }}
              className={`${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              } hover:bg-indigo-50 transition-colors duration-150`}
            >
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-900 border-b border-b-gray-200">
                {row.district}
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {row.year}
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-center border-b border-b-gray-200">
                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-semibold ${
                  row.season === "Aus" ? "bg-green-100 text-green-800" :
                  row.season === "Aman" || row.season === "T.Aman" || row.season === "B.Aman" ? "bg-blue-100 text-blue-800" :
                  "bg-orange-100 text-orange-800"
                }`}>
                  {row.season}
                </span>
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.area)}
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.production)}
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-semibold text-indigo-700 text-center border-b border-b-gray-200">
                {formatNumber(row.yield)}
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

export default DistrictWiseTable;
