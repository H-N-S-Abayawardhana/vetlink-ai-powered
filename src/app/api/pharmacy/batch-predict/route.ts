import { NextRequest, NextResponse } from "next/server";
import { PharmacyDemandApiService } from "@/services/pharmacyDemandApi";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: "Only CSV files are supported" },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must have at least a header row and one data row" },
        { status: 400 }
      );
    }

    // Parse CSV headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Required columns
    const requiredColumns = [
      'medicine_id', 'price', 'inventory_level', 'expiry_days',
      'location_lat', 'location_long', 'promotion_flag',
      'sales_lag_1', 'sales_lag_3', 'sales_lag_7', 'sales_lag_14',
      'sales_rolling_mean_7', 'sales_rolling_mean_14'
    ];

    // Check if all required columns are present
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse data rows
    const results = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(',').map(v => v.trim());
        const rowData: any = {};

        // Map CSV columns to data
        headers.forEach((header, index) => {
          const value = values[index];
          if (requiredColumns.includes(header)) {
            // Convert to appropriate types
            if (['price', 'inventory_level', 'expiry_days', 'location_lat', 'location_long',
                 'sales_lag_1', 'sales_lag_3', 'sales_lag_7', 'sales_lag_14',
                 'sales_rolling_mean_7', 'sales_rolling_mean_14'].includes(header)) {
              rowData[header] = parseFloat(value) || 0;
            } else if (header === 'promotion_flag') {
              rowData[header] = parseInt(value) || 0;
            } else {
              rowData[header] = value;
            }
          }
        });

        // Make prediction
        const prediction = await PharmacyDemandApiService.predictDemand(rowData);

        results.push({
          ...rowData,
          prediction: prediction.prediction || 0,
          html: prediction.html || '',
        });

      } catch (rowError) {
        errors.push({
          row: i,
          error: rowError instanceof Error ? rowError.message : 'Unknown error',
          data: line
        });
      }
    }

    // Generate CSV output
    const outputHeaders = [
      ...requiredColumns,
      'predicted_sales',
      'days_to_stockout'
    ];

    const outputRows = [
      outputHeaders.join(','),
      ...results.map(row => [
        row.medicine_id,
        row.price,
        row.inventory_level,
        row.expiry_days,
        row.location_lat,
        row.location_long,
        row.promotion_flag,
        row.sales_lag_1,
        row.sales_lag_3,
        row.sales_lag_7,
        row.sales_lag_14,
        row.sales_rolling_mean_7,
        row.sales_rolling_mean_14,
        row.prediction,
        Math.max(1, Math.round(row.inventory_level / (row.prediction + 1)))
      ].join(','))
    ];

    const outputCsv = outputRows.join('\n');

    // Return results
    return NextResponse.json({
      success: true,
      count: results.length,
      errors: errors.length,
      errorDetails: errors,
      downloadUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(outputCsv)}`,
      summary: `Processed ${results.length} medicines successfully${errors.length > 0 ? `, ${errors.length} errors` : ''}`
    });

  } catch (error) {
    console.error("Batch prediction error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process batch prediction"
      },
      { status: 500 }
    );
  }
}