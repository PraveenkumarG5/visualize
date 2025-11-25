package com.app.dashboard.visualize_dashboard.service;

import org.apache.poi.openxml4j.opc.OPCPackage;
import org.apache.poi.openxml4j.opc.PackageAccess;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.util.IOUtils;
import org.apache.poi.ooxml.util.SAXHelper;
import org.apache.poi.openxml4j.util.ZipSecureFile;
import org.apache.poi.xssf.eventusermodel.ReadOnlySharedStringsTable;
import org.apache.poi.xssf.eventusermodel.XSSFReader;
import org.apache.poi.xssf.eventusermodel.XSSFSheetXMLHandler;
import org.apache.poi.xssf.model.StylesTable;
import org.apache.poi.xssf.usermodel.XSSFComment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.xml.sax.ContentHandler;
import org.xml.sax.InputSource;
import org.xml.sax.XMLReader;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExcelParsingService {

    private static final Logger logger = LoggerFactory.getLogger(ExcelParsingService.class);

    static {
        // Mitigate vulnerability to XML External Entity (XXE) attacks
        System.setProperty("javax.xml.parsers.DocumentBuilderFactory", "com.sun.org.apache.xerces.internal.jaxp.DocumentBuilderFactoryImpl");
        System.setProperty("javax.xml.parsers.SAXParserFactory", "com.sun.org.apache.xerces.internal.jaxp.SAXParserFactoryImpl");
        // Set higher override value for byte array maximum size and lower minimum inflation ratio for zip bomb detection
        IOUtils.setByteArrayMaxOverride(400000000);
        ZipSecureFile.setMinInflateRatio(0.001);
    }

    public Map<String, Object> parseExcelFile(String filePath) throws IOException {
        logger.info("Parsing Excel file with SAX: {}", filePath);
        try (OPCPackage opcPackage = OPCPackage.open(filePath, PackageAccess.READ)) {
            ReadOnlySharedStringsTable sharedStrings = new ReadOnlySharedStringsTable(opcPackage);
            XSSFReader xssfReader = new XSSFReader(opcPackage);
            StylesTable styles = xssfReader.getStylesTable();
            XSSFReader.SheetIterator iter = (XSSFReader.SheetIterator) xssfReader.getSheetsData();

            if (iter.hasNext()) { // Process only the first sheet
                try (InputStream stream = iter.next()) {
                    SheetContentsHandlerImpl handler = new SheetContentsHandlerImpl();
                    DataFormatter formatter = new DataFormatter();
                    XSSFSheetXMLHandler sheetHandler = new XSSFSheetXMLHandler(styles, sharedStrings, handler, formatter, false);

                    XMLReader sheetParser = SAXHelper.newXMLReader();
                    sheetParser.setContentHandler(sheetHandler);
                    
                    InputSource sheetSource = new InputSource(stream);
                    sheetParser.parse(sheetSource);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("columns", handler.getColumns());
                    result.put("rows", handler.getRows());
                    logger.info("Parsed {} rows with {} columns from the first sheet using SAX", handler.getRows().size(), handler.getColumns().size());
                    return result;
                }
            }
        } catch (Exception e) {
            throw new IOException("Failed to parse Excel file with SAX", e);
        }
        return new HashMap<>(); // Return empty map if no sheets are found
    }

    public Map<String, Object> parseExcelFile(InputStream inputStream) throws IOException {
        logger.info("Parsing Excel file from input stream with SAX");
        File tempFile = Files.createTempFile("excel-", ".xlsx").toFile();
        try {
            Files.copy(inputStream, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            return parseExcelFile(tempFile.getAbsolutePath());
        } finally {
            if (tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    private static class SheetContentsHandlerImpl implements XSSFSheetXMLHandler.SheetContentsHandler {
        private final List<Map<String, Object>> rows = new ArrayList<>();
        private final List<String> columns = new ArrayList<>();
        private Map<String, Object> currentRow;
        private int lastColumnIndex = -1;
        private boolean isHeaderRow = true;
        private final Map<String, Integer> headerNameCounts = new LinkedHashMap<>();

        private int getColumnIndex(String cellReference) {
            if (cellReference == null) {
                return -1;
            }
            return new org.apache.poi.ss.util.CellReference(cellReference).getCol();
        }

        @Override
        public void startRow(int rowNum) {
            if (rowNum == 0) {
                isHeaderRow = true;
                headerNameCounts.clear(); // Clear counts for each new header row parsing
            } else {
                isHeaderRow = false;
                currentRow = new LinkedHashMap<>();
            }
            lastColumnIndex = -1;
        }

        @Override
        public void endRow(int rowNum) {
            if (!isHeaderRow && currentRow != null) {
                for (int i = lastColumnIndex + 1; i < columns.size(); i++) {
                    currentRow.put(columns.get(i), "");
                }
                if (!currentRow.isEmpty() || !columns.isEmpty()) {
                    rows.add(currentRow);
                }
            }
            currentRow = null;
        }

        @Override
        public void cell(String cellReference, String formattedValue, XSSFComment comment) {
            int thisCol = getColumnIndex(cellReference);

            for (int i = lastColumnIndex + 1; i < thisCol; i++) {
                if (isHeaderRow) {
                    columns.add("");
                } else if (currentRow != null && i < columns.size()) {
                    currentRow.put(columns.get(i), "");
                }
            }

            if (isHeaderRow) {
                String baseHeader = formattedValue;
                int count = headerNameCounts.getOrDefault(baseHeader, 0);
                headerNameCounts.put(baseHeader, count + 1);
                String uniqueHeader = baseHeader;
                if (count > 0) {
                    uniqueHeader = baseHeader + " (" + count + ")";
                }
                columns.add(uniqueHeader);
            } else if (currentRow != null && thisCol < columns.size()) {
                currentRow.put(columns.get(thisCol), formattedValue);
            }
            lastColumnIndex = thisCol;
        }

        @Override
        public void headerFooter(String text, boolean isHeader, String tagName) {
            // Ignoring header/footer
        }

        public List<Map<String, Object>> getRows() {
            return rows;
        }

        public List<String> getColumns() {
            return columns;
        }
    }
}