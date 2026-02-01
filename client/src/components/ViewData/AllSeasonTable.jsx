import { motion } from "framer-motion";
import ActionButtons from "./ActionButtons";

const AllSeasonTable = ({ data, formatNumber, onEdit, onDelete }) => {
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
          <tr className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
            <th rowSpan="2" className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-left text-xs sm:text-sm font-semibold border-b-2 border-b-teal-800 border-r border-r-teal-500">
              Year
            </th>
            <th colSpan="3" className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-xs sm:text-sm font-semibold border-b border-b-teal-500 border-r border-r-teal-500">
              Area (000' ha)
            </th>
            <th colSpan="3" className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-xs sm:text-sm font-semibold border-b border-b-teal-500 border-r border-r-teal-500">
              Production (000' MT)
            </th>
            <th colSpan="3" className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-xs sm:text-sm font-semibold border-b border-b-teal-500 border-r border-r-teal-500">
              Yield (MT/ha)
            </th>
            <th rowSpan="2" className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-teal-800">
              Actions
            </th>
          </tr>
          <tr className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-[10px] sm:text-xs font-semibold border-b-2 border-b-teal-800 border-r border-r-teal-400">Aus</th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-[10px] sm:text-xs font-semibold border-b-2 border-b-teal-800 border-r border-r-teal-400">Aman</th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-[10px] sm:text-xs font-semibold border-b-2 border-b-teal-800 border-r border-r-teal-500">Boro</th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-[10px] sm:text-xs font-semibold border-b-2 border-b-teal-800 border-r border-r-teal-400">Aus</th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-[10px] sm:text-xs font-semibold border-b-2 border-b-teal-800 border-r border-r-teal-400">Aman</th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-[10px] sm:text-xs font-semibold border-b-2 border-b-teal-800 border-r border-r-teal-500">Boro</th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-[10px] sm:text-xs font-semibold border-b-2 border-b-teal-800 border-r border-r-teal-400">Aus</th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-[10px] sm:text-xs font-semibold border-b-2 border-b-teal-800 border-r border-r-teal-400">Aman</th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-[10px] sm:text-xs font-semibold border-b-2 border-b-teal-800 border-r border-r-teal-500">Boro</th>
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
              } hover:bg-teal-50 transition-colors duration-150`}
            >
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-900 border-b border-b-gray-200 border-r border-r-gray-200">
                {row.year}
              </td>
              
              {/* Area columns */}
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200 border-r border-r-gray-200">
                {formatNumber(row.areaAus)}
              </td>
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200 border-r border-r-gray-200">
                {formatNumber(row.areaAman)}
              </td>
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200 border-r border-r-gray-200">
                {formatNumber(row.areaBoro)}
              </td>
              
              {/* Production columns */}
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200 border-r border-r-gray-200">
                {formatNumber(row.prodAus)}
              </td>
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200 border-r border-r-gray-200">
                {formatNumber(row.prodAman)}
              </td>
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200 border-r border-r-gray-200">
                {formatNumber(row.prodBoro)}
              </td>
              
              {/* Yield columns */}
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200 border-r border-r-gray-200">
                {formatNumber(row.yieldAus)}
              </td>
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200 border-r border-r-gray-200">
                {formatNumber(row.yieldAman)}
              </td>
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200 border-r border-r-gray-200">
                {formatNumber(row.yieldBoro)}
              </td>
              
              {/* Actions */}
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-center border-b border-b-gray-200">
                <ActionButtons row={row} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllSeasonTable;
