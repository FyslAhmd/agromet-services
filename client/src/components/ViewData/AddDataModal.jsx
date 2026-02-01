import { motion } from "framer-motion";

const AddDataModal = ({ 
  isOpen, 
  onClose, 
  selectedDataType, 
  formData, 
  setFormData, 
  onSubmit 
}) => {
  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Add New Record</h2>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2023"
                  value={formData.year || ""}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.dataType || ""}
                  onChange={(e) => handleInputChange("dataType", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">-- Select Type --</option>
                  <option value="area">Area</option>
                  <option value="production">Production</option>
                  <option value="yield">Yield</option>
                </select>
              </div>
              
              <h3 className="col-span-full text-lg font-semibold text-green-700 mt-4 border-t pt-4">Aus Season</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MV</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.ausMv || ""}
                  onChange={(e) => handleInputChange("ausMv", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LV</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.ausLv || ""}
                  onChange={(e) => handleInputChange("ausLv", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <h3 className="col-span-full text-lg font-semibold text-blue-700 mt-4 border-t pt-4">Aman Season</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">T.Aman MV</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.tamanMv || ""}
                  onChange={(e) => handleInputChange("tamanMv", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">T.Aman LV</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.tamanLv || ""}
                  onChange={(e) => handleInputChange("tamanLv", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">B.Aman</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.bamanMv || ""}
                  onChange={(e) => handleInputChange("bamanMv", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <h3 className="col-span-full text-lg font-semibold text-orange-700 mt-4 border-t pt-4">Boro Season</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MV</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.boroMv || ""}
                  onChange={(e) => handleInputChange("boroMv", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LV</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.boroLv || ""}
                  onChange={(e) => handleInputChange("boroLv", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {selectedDataType === "export-import" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2023"
                  value={formData.year || ""}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div></div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Export Quantity (ton) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.exportQuantity || ""}
                  onChange={(e) => handleInputChange("exportQuantity", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Import Quantity (ton) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.importQuantity || ""}
                  onChange={(e) => handleInputChange("importQuantity", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {selectedDataType === "cropping-intensity" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2023"
                  value={formData.year || ""}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div></div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Single Cropped Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.singleCroppedArea || ""}
                  onChange={(e) => handleInputChange("singleCroppedArea", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Double Cropped Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.doubleCroppedArea || ""}
                  onChange={(e) => handleInputChange("doubleCroppedArea", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Triple Cropped Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.tripleCroppedArea || ""}
                  onChange={(e) => handleInputChange("tripleCroppedArea", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Net Cropped Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.netCroppedArea || ""}
                  onChange={(e) => handleInputChange("netCroppedArea", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cropping Intensity (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.croppingIntensity || ""}
                  onChange={(e) => handleInputChange("croppingIntensity", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
          )}

          {selectedDataType === "all-season" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.year || ""}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., 1971-72"
                />
              </div>
              <div></div>
              <div className="md:col-span-2">
                <h3 className="text-md font-bold text-teal-700 mb-3">Area (Hectares)</h3>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Aus <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.areaAus || ""}
                  onChange={(e) => handleInputChange("areaAus", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Aman <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.areaAman || ""}
                  onChange={(e) => handleInputChange("areaAman", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Boro <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.areaBoro || ""}
                  onChange={(e) => handleInputChange("areaBoro", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div></div>
              <div className="md:col-span-2">
                <h3 className="text-md font-bold text-teal-700 mb-3">Production (Metric Tons)</h3>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Aus <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.prodAus || ""}
                  onChange={(e) => handleInputChange("prodAus", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Aman <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.prodAman || ""}
                  onChange={(e) => handleInputChange("prodAman", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Boro <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.prodBoro || ""}
                  onChange={(e) => handleInputChange("prodBoro", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div></div>
              <div className="md:col-span-2">
                <h3 className="text-md font-bold text-teal-700 mb-3">Yield (MT/Hectare)</h3>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Aus <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.yieldAus || ""}
                  onChange={(e) => handleInputChange("yieldAus", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Aman <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.yieldAman || ""}
                  onChange={(e) => handleInputChange("yieldAman", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Boro <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.yieldBoro || ""}
                  onChange={(e) => handleInputChange("yieldBoro", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {selectedDataType === "district" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  District <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dhaka"
                  value={formData.district || ""}
                  onChange={(e) => handleInputChange("district", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2023"
                  value={formData.year || ""}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Season <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.season || ""}
                  onChange={(e) => handleInputChange("season", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Select Season --</option>
                  <option value="Aus">Aus</option>
                  <option value="Aman">Aman</option>
                  <option value="T.Aman">T.Aman</option>
                  <option value="B.Aman">B.Aman</option>
                  <option value="Boro">Boro</option>
                </select>
              </div>
              <div></div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.area || ""}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Production <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.production || ""}
                  onChange={(e) => handleInputChange("production", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Yield <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.yield || ""}
                  onChange={(e) => handleInputChange("yield", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {selectedDataType === "rice-adoption-rate" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2023"
                  value={formData.year || ""}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Season <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.season || ""}
                  onChange={(e) => handleInputChange("season", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Variety <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., BRRI dhan28"
                  value={formData.variety || ""}
                  onChange={(e) => handleInputChange("variety", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adoption Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 45.5"
                  value={formData.adoptionRate || ""}
                  onChange={(e) => handleInputChange("adoptionRate", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
          )}

          {selectedDataType === "faostat" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Element <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Harvested Rice Area (ha)"
                  value={formData.element || ""}
                  onChange={(e) => handleInputChange("element", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 1961"
                  value={formData.year || ""}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="e.g., 8483516"
                  value={formData.value || ""}
                  onChange={(e) => handleInputChange("value", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Record
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AddDataModal;
