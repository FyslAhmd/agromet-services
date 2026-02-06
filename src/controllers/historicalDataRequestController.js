import HistoricalDataRequest from "../models/HistoricalDataRequest.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import nodemailer from "nodemailer";
import path from "path";
import { generateHistoricalFiles, cleanupTempFiles } from "../services/historicalFileGeneratorService.js";
import { parameterLabels } from "../services/historicalDataFetcherService.js";

// Email transporter configuration (reuse existing SMTP settings if available)
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "faiz4121820@gmail.com",
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// Get all historical data requests with pagination and filters
export const getAllHistoricalDataRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      email,
      organization,
      startDate,
      endDate,
      sortBy = 'requestDateTime',
      sortOrder = 'DESC'
    } = req.query;

    // Build where conditions
    const whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (email) {
      whereConditions.email = {
        [Op.like]: `%${email}%`
      };
    }
    
    if (organization) {
      whereConditions.organization = {
        [Op.like]: `%${organization}%`
      };
    }
    
    if (startDate && endDate) {
      whereConditions.requestDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereConditions.requestDateTime = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.requestDateTime = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch requests with pagination
    const { count, rows: requests } = await HistoricalDataRequest.findAndCountAll({
      where: whereConditions,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Transform status for frontend compatibility
    const transformedRequests = requests.map(request => {
      const requestData = request.toJSON();
      const statusMap = {
        'Pending': 'Pending',
        'Processing': 'Processing',
        'Completed': 'Approved',
        'Rejected': 'Rejected'
      };
      requestData.status = statusMap[requestData.status] || requestData.status;
      requestData.submitTime = requestData.requestDateTime;
      return requestData;
    });

    res.status(200).json({
      success: true,
      data: transformedRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: count,
        recordsPerPage: parseInt(limit),
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    console.error("Error fetching historical data requests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Create a new historical data request
export const createHistoricalDataRequest = async (req, res) => {
  try {
    const {
      name,
      designation,
      organization,
      address,
      email,
      mobile,
      startDate,
      endDate,
      timeInterval,
      dataAverage,
      selectedStations,
      selectedParameters,
      selectedDataFormats,
      userId
    } = req.body;

    // Validation - Personal info
    if (!name || !designation || !organization || !address || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: "All personal information fields are required"
      });
    }

    // Either timeInterval OR (startDate AND endDate) must be provided
    const hasTimeInterval = timeInterval && timeInterval !== '';
    const hasCustomDates = startDate && endDate;
    
    if (!hasTimeInterval && !hasCustomDates) {
      return res.status(400).json({
        success: false,
        message: "Either select a time interval or provide custom date range"
      });
    }

    // Validate stations
    if (!selectedStations || !Array.isArray(selectedStations) || selectedStations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one research station must be selected"
      });
    }

    // Validate parameters
    if (!selectedParameters || !Array.isArray(selectedParameters) || selectedParameters.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one climate parameter must be selected"
      });
    }

    // Validate data formats
    if (!selectedDataFormats || !Array.isArray(selectedDataFormats) || selectedDataFormats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one data format must be selected"
      });
    }

    // Validate custom date range if provided
    if (hasCustomDates) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      
      if (start > end) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date"
        });
      }

      if (start > today || end > today) {
        return res.status(400).json({
          success: false,
          message: "Dates cannot be in the future"
        });
      }
    }

    // Create the request
    const newRequest = await HistoricalDataRequest.create({
      name: name.trim(),
      designation: designation.trim(),
      organization: organization.trim(),
      address: address.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      timeInterval: timeInterval || null,
      dataAverage: dataAverage || 'none',
      selectedStations,
      selectedParameters,
      selectedDataFormats,
      UserId: userId || null,
      requestDateTime: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Historical data request submitted successfully",
      data: {
        id: newRequest.id,
        name: newRequest.name,
        email: newRequest.email,
        organization: newRequest.organization,
        status: newRequest.status,
        requestDateTime: newRequest.requestDateTime
      }
    });
  } catch (error) {
    console.error("Error creating historical data request:", error);
    
    if (error.name === 'SequelizeValidationError') {
      const errorMessages = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errorMessages
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update request status (Admin functionality)
export const updateHistoricalDataRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    // Map frontend status to backend
    const statusMap = {
      'pending': 'Pending',
      'Pending': 'Pending',
      'approved': 'Completed',
      'Approved': 'Completed',
      'rejected': 'Rejected',
      'Rejected': 'Rejected',
      'processing': 'Processing',
      'Processing': 'Processing',
      'completed': 'Completed',
      'Completed': 'Completed'
    };

    const mappedStatus = statusMap[status];

    if (!mappedStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses are: pending, approved, rejected, processing`
      });
    }

    const request = await HistoricalDataRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    // Update the request
    await request.update({
      status: mappedStatus,
      remarks: remarks || request.remarks
    });

    // Send email notification based on status
    try {
      if (mappedStatus === "Completed") {
        await sendAcceptEmail(request.toJSON());
      } else if (mappedStatus === "Rejected") {
        await sendRejectEmail(request.toJSON());
      }
    } catch (emailError) {
      console.error("⚠️ Email sending error:", emailError.message);
    }

    res.status(200).json({
      success: true,
      message: "Request status updated successfully",
      data: {
        id: request.id,
        name: request.name,
        email: request.email,
        status: request.status,
        remarks: request.remarks
      }
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get statistics
export const getHistoricalDataRequestStats = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let dateFormat, groupByClause;
    const now = new Date();
    let calculatedStartDate;

    // Set date format based on period
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        calculatedStartDate = new Date(now);
        calculatedStartDate.setDate(now.getDate() - 30);
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        calculatedStartDate = new Date(now);
        calculatedStartDate.setDate(now.getDate() - 84);
        break;
      case 'monthly':
      default:
        dateFormat = '%Y-%m';
        calculatedStartDate = new Date(now);
        calculatedStartDate.setMonth(now.getMonth() - 12);
        break;
    }

    let dateRangeCondition = {};
    if (startDate && endDate) {
      calculatedStartDate = new Date(startDate);
      dateRangeCondition = {
        requestDateTime: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    } else {
      dateRangeCondition = {
        requestDateTime: {
          [Op.gte]: calculatedStartDate
        }
      };
    }

    // MySQL query
    groupByClause = `DATE_FORMAT(requestDateTime, '${dateFormat}')`;
    
    const query = `
      SELECT 
        ${groupByClause} as period,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Processing' THEN 1 ELSE 0 END) as processing
      FROM HistoricalDataRequests
      WHERE requestDateTime >= :startDate
      ${endDate ? 'AND requestDateTime <= :endDate' : ''}
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `;

    const replacements = {
      startDate: startDate || calculatedStartDate,
    };

    if (endDate) {
      replacements.endDate = endDate;
    }

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const transformedResults = results.map(row => ({
      period: row.period,
      total: parseInt(row.total) || 0,
      approved: parseInt(row.approved) || 0,
      rejected: parseInt(row.rejected) || 0,
      pending: parseInt(row.pending) || 0,
      processing: parseInt(row.processing) || 0
    }));

    res.status(200).json({
      success: true,
      data: transformedResults,
      meta: {
        period,
        startDate: startDate || calculatedStartDate.toISOString().split('T')[0],
        endDate: endDate || now.toISOString().split('T')[0],
        totalRecords: transformedResults.length
      }
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get single request by ID
export const getHistoricalDataRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await HistoricalDataRequest.findByPk(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error("Error fetching request:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Helper: Send acceptance email with attachments
const sendAcceptEmail = async (request) => {
  let tempDir = null;
  
  try {
    const transporter = createEmailTransporter();
    
    console.log(`\n📦 Generating files for Historical Data request #${request.id}...`);
    
    // Generate files (charts and CSVs) based on selected formats
    const fileGenerationResult = await generateHistoricalFiles(request);
    
    if (!fileGenerationResult.success) {
      console.error('⚠️  File generation failed:', fileGenerationResult.error || 'Unknown error');
      console.log('📧 Sending email without attachments...');
    }

    tempDir = fileGenerationResult.tempDir;
    const allFiles = [...(fileGenerationResult.images || []), ...(fileGenerationResult.csvs || [])];

    // Prepare attachments
    const attachments = allFiles.map(filePath => ({
      filename: path.basename(filePath),
      path: filePath
    }));

    console.log(`📎 Prepared ${attachments.length} attachment(s)`);

    const parametersFormatted = (request.selectedParameters || [])
      .map(p => parameterLabels[p] || p)
      .join(', ');

    const stationsFormatted = (request.selectedStations || []).join(', ');

    const dateRangeText = request.timeInterval 
      ? `Time Interval: ${request.timeInterval}`
      : `Custom Range: ${request.startDate} to ${request.endDate}`;

    const attachmentNote = attachments.length > 0 
      ? `<p><strong>📎 Attached Files:</strong> ${attachments.length} file(s) - ${attachments.map(a => a.filename).join(', ')}</p>`
      : '<p style="color: #f59e0b;"><strong>⚠️ Note:</strong> No data files could be generated for your request. This may be due to no data being available for the selected combination of stations, parameters, and date range.</p>';

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">✅ Request Approved!</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px;">Dear ${request.name},</p>
          <p>Your historical climate data request has been <strong style="color: #10b981;">approved</strong>!</p>
          
          <div style="background-color: #D1FAE5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #065f46;">Request Details:</h3>
            <p style="margin: 5px 0; color: #065f46;"><strong>Stations:</strong> ${stationsFormatted}</p>
            <p style="margin: 5px 0; color: #065f46;"><strong>Parameters:</strong> ${parametersFormatted}</p>
            <p style="margin: 5px 0; color: #065f46;"><strong>${dateRangeText}</strong></p>
            <p style="margin: 5px 0; color: #065f46;"><strong>Data Average:</strong> ${request.dataAverage || 'None'}</p>
            <p style="margin: 5px 0; color: #065f46;"><strong>Formats:</strong> ${(request.selectedDataFormats || []).join(', ')}</p>
          </div>
          
          ${attachmentNote}
          
          ${request.remarks ? `<p style="background-color: #f0f9ff; padding: 10px; border-radius: 5px;"><strong>Admin Remarks:</strong> ${request.remarks}</p>` : ''}
          
          <p>If you have any questions about the data, please contact us at agromet@brri.gov.bd</p>
          
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} BRRI Agromet Services. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"BRRI Agromet Services" <${process.env.EMAIL_USER || 'faiz4121820@gmail.com'}>`,
      to: request.email,
      subject: `✅ Your Historical Climate Data Request Has Been Approved - BRRI${attachments.length > 0 ? ` (${attachments.length} files attached)` : ''}`,
      html: html,
      attachments: attachments
    };

    console.log(`📧 Sending email with ${attachments.length} attachment(s)...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent to ${request.email} (ID: ${info.messageId})`);
    
    // Cleanup temporary files after successful email
    if (tempDir) {
      await cleanupTempFiles(tempDir);
    }
    
    return { 
      success: true, 
      messageId: info.messageId,
      attachmentsCount: attachments.length
    };
  } catch (error) {
    console.error(`❌ Failed to send approval email:`, error.message);
    
    // Cleanup temp files even on error
    if (tempDir) {
      await cleanupTempFiles(tempDir);
    }
    
    return { success: false, error: error.message };
  }
};

// Helper: Send rejection email
const sendRejectEmail = async (request) => {
  try {
    const transporter = createEmailTransporter();

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">Request Status Update</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px;">Dear ${request.name},</p>
          <p>We regret to inform you that your historical climate data request could not be approved at this time.</p>
          
          ${request.remarks ? `
            <div style="background-color: #FEE2E2; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${request.remarks}</p>
            </div>
          ` : ''}
          
          <p>If you believe this was in error or would like to submit a new request with modifications, please feel free to do so.</p>
          
          <p>For assistance, please contact our support team.</p>
          
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} BRRI Agromet Services. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"BRRI Agromet Services" <${process.env.EMAIL_USER || 'faiz4121820@gmail.com'}>`,
      to: request.email,
      subject: "📋 Historical Climate Data Request - Status Update - BRRI",
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Rejection email sent to ${request.email} (ID: ${info.messageId})`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send rejection email:`, error.message);
    return { success: false, error: error.message };
  }
};

export default {
  getAllHistoricalDataRequests,
  createHistoricalDataRequest,
  updateHistoricalDataRequestStatus,
  getHistoricalDataRequestStats,
  getHistoricalDataRequestById
};
