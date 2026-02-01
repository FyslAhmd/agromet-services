import { motion } from "framer-motion";
import ActionButtons from "./ActionButtons";

const SeasonalTable = ({ data, formatNumber, onEdit, onDelete, onRefresh }) => {
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
          <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm font-semibold border-b-2 border-b-green-800 border-r-2 border-r-gray-300">
              Year
            </th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-green-800 border-r-2 border-r-gray-300" colSpan="4">
              Aus Season
            </th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-green-800 border-r-2 border-r-gray-300" colSpan="5">
              Aman Season (T.Aman + B.Aman)
            </th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-green-800 border-r-2 border-r-gray-300" colSpan="4">
              Boro Season
            </th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-green-800 border-r-2 border-r-gray-300" colSpan="2">
              Total
            </th>
            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-green-800">
              Actions
            </th>
          </tr>
          <tr className="bg-green-600 text-white">
            <th className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium border-b border-b-green-700 border-r-2 border-r-gray-300"></th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700">MV</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700">LV</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700">Total</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700 border-r-2 border-r-gray-300">MV %</th>
            
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700">T.Aman MV</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700">T.Aman LV</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700">B.Aman</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700">Total</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700 border-r-2 border-r-gray-300">MV %</th>
            
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700">MV</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700">LV</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700">Total</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-b-green-700 border-r-2 border-r-gray-300">MV %</th>
            
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-green-700">Grand Total</th>
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-green-700 border-r-2 border-r-gray-300">MV %</th>
            
            <th className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium border-b border-green-700"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className={`
                ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                hover:bg-green-50 transition-colors duration-200
              `}
            >
              <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-semibold text-gray-800 border-b border-b-gray-200 border-r-2 border-r-gray-300">
                {row.year}
              </td>
              
              {/* Aus Season */}
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.ausMv)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.ausLv)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm font-medium text-gray-800 text-center border-b border-b-gray-200 bg-green-50">
                {formatNumber(row.ausTotal)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-green-700 font-medium text-center border-b border-b-gray-200 border-r-2 border-r-gray-300">
                {formatNumber(row.ausMvPercent)}%
              </td>
              
              {/* Aman Season */}
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.tamanMv)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.tamanLv)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.bamanMv)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm font-medium text-gray-800 text-center border-b border-b-gray-200 bg-blue-50">
                {formatNumber(row.amanTotal)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-blue-700 font-medium text-center border-b border-b-gray-200 border-r-2 border-r-gray-300">
                {formatNumber(row.amanMvPercent)}%
              </td>
              
              {/* Boro Season */}
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.boroMv)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                {formatNumber(row.boroLv)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm font-medium text-gray-800 text-center border-b border-b-gray-200 bg-orange-50">
                {formatNumber(row.boroTotal)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-orange-700 font-medium text-center border-b border-b-gray-200 border-r-2 border-r-gray-300">
                {formatNumber(row.boroMvPercent)}%
              </td>
              
              {/* Totals */}
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm font-bold text-gray-900 text-center border-b border-b-gray-200 bg-gradient-to-r from-green-100 to-green-200">
                {formatNumber(row.grandTotal)}
              </td>
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm font-bold text-green-800 text-center border-b border-b-gray-200 bg-gradient-to-r from-green-100 to-green-200 border-r-2 border-r-gray-300">
                {formatNumber(row.mvPercent)}%
              </td>
              
              {/* Actions */}
              <td className="px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-center border-b border-b-gray-200">
                <ActionButtons row={row} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SeasonalTable;
