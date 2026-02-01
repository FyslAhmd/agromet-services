import { motion } from "framer-motion";

const EditModal = ({ 
  isOpen, 
  onClose, 
  selectedDataType, 
  editFormData, 
  setEditFormData, 
  onSubmit 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Edit Record</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {selectedDataType === "seasonal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  type="text"
                  value={editFormData.year || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Data Type</label>
                <input
                  type="text"
                  value={editFormData.dataType || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
              
              <h3 className="col-span-full text-lg font-semibold text-green-700 mt-4">Aus Season</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MV</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.ausMv || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, ausMv: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LV</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.ausLv || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, ausLv: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <h3 className="col-span-full text-lg font-semibold text-blue-700 mt-4">Aman Season</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">T.Aman MV</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.tamanMv || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, tamanMv: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">T.Aman LV</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.tamanLv || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, tamanLv: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">B.Aman</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.bamanMv || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, bamanMv: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <h3 className="col-span-full text-lg font-semibold text-orange-700 mt-4">Boro Season</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MV</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.boroMv || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, boroMv: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LV</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.boroLv || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, boroLv: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {selectedDataType === "export-import" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  type="text"
                  value={editFormData.year || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
              <div></div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Export Quantity (ton)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.exportQuantity || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, exportQuantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Import Quantity (ton)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.importQuantity || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, importQuantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {selectedDataType === "cropping-intensity" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  type="text"
                  value={editFormData.year || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
              <div></div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Single Cropped Area</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.singleCroppedArea || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, singleCroppedArea: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Double Cropped Area</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.doubleCroppedArea || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, doubleCroppedArea: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Triple Cropped Area</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.tripleCroppedArea || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, tripleCroppedArea: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Net Cropped Area</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.netCroppedArea || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, netCroppedArea: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cropping Intensity (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.croppingIntensity || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, croppingIntensity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {selectedDataType === "all-season" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  type="text"
                  value={editFormData.year || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
              <div></div>
              <div className="md:col-span-2">
                <h3 className="text-md font-bold text-teal-700 mb-3">Area (Hectares)</h3>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Aus</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.areaAus || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, areaAus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Aman</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.areaAman || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, areaAman: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Boro</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.areaBoro || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, areaBoro: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div></div>
              <div className="md:col-span-2">
                <h3 className="text-md font-bold text-teal-700 mb-3">Production (Metric Tons)</h3>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Aus</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.prodAus || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, prodAus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Aman</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.prodAman || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, prodAman: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Boro</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.prodBoro || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, prodBoro: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div></div>
              <div className="md:col-span-2">
                <h3 className="text-md font-bold text-teal-700 mb-3">Yield (MT/Hectare)</h3>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Aus</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.yieldAus || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, yieldAus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Aman</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.yieldAman || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, yieldAman: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Boro</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.yieldBoro || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, yieldBoro: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {selectedDataType === "district" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                <input
                  type="text"
                  value={editFormData.district || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  type="text"
                  value={editFormData.year || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Season</label>
                <input
                  type="text"
                  value={editFormData.season || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
              <div></div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Area</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.area || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, area: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Production</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.production || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, production: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Yield</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.yield || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, yield: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {selectedDataType === "rice-adoption-rate" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  type="text"
                  value={editFormData.year || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Season</label>
                <select
                  value={editFormData.season || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, season: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Season</option>
                  <option value="Aus">Aus</option>
                  <option value="Aman">Aman</option>
                  <option value="Boro">Boro</option>
                  <option value="T.Aman">T.Aman</option>
                  <option value="B.Aman">B.Aman</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Variety</label>
                <input
                  type="text"
                  value={editFormData.variety || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, variety: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., BRRI dhan28"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adoption Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.adoptionRate || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, adoptionRate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 45.5"
                />
              </div>
            </div>
          )}

          {selectedDataType === "faostat" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Element *</label>
                <input
                  type="text"
                  value={editFormData.element || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, element: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Harvested Rice Area (ha)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
                <input
                  type="text"
                  value={editFormData.year || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1961"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Value *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editFormData.value || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 8483516"
                  required
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Update
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EditModal;
