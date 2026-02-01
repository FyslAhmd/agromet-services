import { motion } from "framer-motion";
import ActionButtons from "./ActionButtons";

const RiceAdoptionRateTable = ({ data, formatNumber, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs sm:text-sm font-semibold border-b-2 border-b-orange-800">
              Year
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-orange-800">
              Season
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs sm:text-sm font-semibold border-b-2 border-b-orange-800">
              Variety
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-orange-800">
              Adoption Rate (%)
            </th>
            <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm font-semibold border-b-2 border-b-orange-800">
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
              } hover:bg-orange-50 transition-colors duration-150`}
            >
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-900 border-b border-b-gray-200">
                {row.year}
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-center border-b border-b-gray-200">
                <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium
                  ${row.season === 'Aus' ? 'bg-yellow-100 text-yellow-800' :
                    row.season === 'Aman' || row.season === 'T.Aman' || row.season === 'B.Aman' ? 'bg-green-100 text-green-800' :
                    row.season === 'Boro' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                  {row.season}
                </span>
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-gray-700 border-b border-b-gray-200">
                {row.variety}
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-gray-700 text-center border-b border-b-gray-200">
                <span className="font-semibold text-orange-600">
                  {formatNumber(row.adoptionRate)}%
                </span>
              </td>
              <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-b border-b-gray-200">
                <ActionButtons
                  onEdit={() => onEdit(row)}
                  onDelete={() => onDelete(row.id)}
                />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RiceAdoptionRateTable;
