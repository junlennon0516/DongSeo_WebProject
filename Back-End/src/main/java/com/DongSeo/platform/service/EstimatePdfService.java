package com.DongSeo.platform.service;

import com.DongSeo.platform.dto.EstimatePdfItemDto;
import com.DongSeo.platform.dto.EstimatePdfRequest;
import com.DongSeo.platform.util.KoreanFontResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/**
 * 견적서 PDF 생성 서비스
 *
 * EC2 등 서버에서 한글이 깨지지 않으려면:
 * - 서버에 한글 폰트 설치 (fonts-nanum) 후 재부팅
 * - 절대경로로 폰트 지정 (KoreanFontResolver)
 * - PDType0Font 로 embed
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EstimatePdfService {

    private final KoreanFontResolver fontResolver;

    private static final float MARGIN = 56f;
    private static final float PAGE_W = 595f;
    private static final float PAGE_H = 842f;
    private static final float LINE_HEIGHT_TITLE = 18f;
    private static final float LINE_HEIGHT = 14f;
    private static final float LINE_HEIGHT_SMALL = 12f;

    public byte[] generatePdf(EstimatePdfRequest req) throws IOException {
        File fontFile = fontResolver.getKoreanFontFile();
        String fontPath = fontFile.getAbsolutePath();
        if (!fontPath.startsWith("/") && !fontPath.matches("^[A-Za-z]:.*")) {
            log.warn("PDF 폰트가 파일시스템 절대경로가 아님. 한글이 깨질 수 있음. 경로={}", fontPath);
        } else {
            log.debug("PDF 한글 폰트 (파일시스템 경로): {}", fontPath);
        }

        try (PDDocument doc = new PDDocument()) {
            PDType0Font font;
            try (InputStream fontStream = new FileInputStream(fontFile)) {
                font = PDType0Font.load(doc, fontStream, true);
            }

            PDPage page = new PDPage(new PDRectangle(PAGE_W, PAGE_H));
            doc.getDocumentCatalog().getPages().add(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true)) {
                float y = PAGE_H - MARGIN;
                float fontSize = 10f;
                float lh = LINE_HEIGHT_SMALL;

                fontSize = 24f;
                cs.setFont(font, fontSize);
                String title = "견적서";
                float tw = font.getStringWidth(title) / 1000 * fontSize;
                drawText(cs, font, fontSize, title, (PAGE_W - tw) / 2f, y);
                y -= LINE_HEIGHT_TITLE;

                fontSize = 14f;
                cs.setFont(font, fontSize);
                drawText(cs, font, fontSize, nvl(req.getCompanyName(), "쉐누 (CHENOUS)"), MARGIN, y);
                y -= LINE_HEIGHT;

                fontSize = 10f;
                cs.setFont(font, fontSize);
                drawText(cs, font, fontSize, "작성일: " + nvl(req.getDateStr(), ""), MARGIN, y);
                y -= LINE_HEIGHT;

                cs.setStrokingColor(200f / 255f, 200f / 255f, 200f / 255f);
                cs.moveTo(MARGIN, y);
                cs.lineTo(PAGE_W - MARGIN, y);
                cs.stroke();
                y -= LINE_HEIGHT;

                fontSize = 12f;
                cs.setFont(font, fontSize);
                drawText(cs, font, fontSize, "견적 내역", MARGIN, y);
                y -= LINE_HEIGHT;

                fontSize = 10f;
                cs.setFont(font, fontSize);

                List<EstimatePdfItemDto> items = req.getItems();
                if (items != null) {
                    for (EstimatePdfItemDto item : items) {
                        y = drawItem(cs, font, fontSize, lh, item, y);
                    }
                }

                cs.setStrokingColor(0f, 0f, 0f);
                cs.moveTo(MARGIN, y);
                cs.lineTo(PAGE_W - MARGIN, y);
                cs.stroke();
                y -= lh;

                drawText(cs, font, fontSize, "총액 (마진 적용 전): " + formatNumber(req.getBaseTotal()) + "원", MARGIN, y);
                y -= lh;
                if (req.getTotalMargin() > 0 && req.getMarginPercent() != null) {
                    drawText(cs, font, fontSize,
                            "회사 마진 (" + req.getMarginPercent() + "%): +" + formatNumber(req.getTotalMargin()) + "원",
                            MARGIN, y);
                    y -= lh;
                }
                fontSize = 14f;
                cs.setFont(font, fontSize);
                drawText(cs, font, fontSize, "총 예상 금액: " + formatNumber(req.getTotalPrice()) + "원", MARGIN, y);
                y -= lh;
                fontSize = 10f;
                cs.setFont(font, fontSize);
                drawText(cs, font, fontSize, "* VAT 별도", MARGIN, y);
                y -= lh;
                drawText(cs, font, fontSize, "* 본 견적서는 참고용이며, 실제 견적은 현장 확인 후 결정됩니다.", MARGIN, y);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private float drawItem(PDPageContentStream cs, PDType0Font font, float fontSize, float lh,
                           EstimatePdfItemDto item, float y) throws IOException {
        String productName = item.getProductName() != null ? item.getProductName() : "";
        if (productName.contains("목재문틀") || productName.contains("사이")) productName = "목재문틀";

        drawText(cs, font, fontSize, productName, MARGIN, y);
        y -= lh;

        if (item.getCategoryName() != null && !item.getCategoryName().isEmpty()) {
            String cat = item.getSubCategoryName() != null && !item.getSubCategoryName().isEmpty()
                    ? item.getCategoryName() + " > " + item.getSubCategoryName()
                    : item.getCategoryName();
            drawText(cs, font, fontSize, "카테고리: " + cat, MARGIN + 14, y);
            y -= lh;
        }
        if (item.getSpecName() != null || item.getTypeName() != null) {
            String st = joinNonEmpty(" / ", item.getSpecName(), item.getTypeName());
            if (!st.isEmpty()) {
                drawText(cs, font, fontSize, "규격/타입: " + st, MARGIN + 14, y);
                y -= lh;
            }
        }
        if (item.getWidth() != null || item.getHeight() != null) {
            String sz = joinNonEmpty(", ",
                    item.getWidth() != null ? "가로: " + item.getWidth() + "mm" : null,
                    item.getHeight() != null ? "세로: " + item.getHeight() + "mm" : null);
            if (!sz.isEmpty()) {
                drawText(cs, font, fontSize, "사이즈: " + sz, MARGIN + 14, y);
                y -= lh;
            }
        }
        if (item.getSelectedColorName() != null && !item.getSelectedColorName().isEmpty()) {
            String colorText = item.getSelectedColorCode() != null && !item.getSelectedColorCode().isEmpty()
                    ? item.getSelectedColorName() + " (" + item.getSelectedColorCode() + ")"
                    : item.getSelectedColorName();
            drawText(cs, font, fontSize, "색상: " + colorText, MARGIN + 14, y);
            y -= lh;
        }

        drawText(cs, font, fontSize, "기본 단가: " + formatNumber(item.getUnitPrice()) + "원", MARGIN + 14, y);
        y -= lh;
        if (nvl(item.getPriceIncreaseReason()).length() > 0) {
            drawText(cs, font, fontSize, item.getPriceIncreaseReason(), MARGIN + 14, y);
            y -= lh;
        }
        if (nvl(item.getColorCostInfo()).length() > 0) {
            drawText(cs, font, fontSize, "색상 추가 비용 " + item.getColorCostInfo(), MARGIN + 14, y);
            y -= lh;
        }
        if (item.getOptionPrice() != 0) {
            String opt = (item.getOptionPrice() > 0 ? "+" : "") + formatNumber(item.getOptionPrice()) + "원";
            drawText(cs, font, fontSize, "추가 옵션 가격: " + opt, MARGIN + 14, y);
            y -= lh;
        }
        if (item.getSelectedOptions() != null && !item.getSelectedOptions().isEmpty()) {
            drawText(cs, font, fontSize, "선택 옵션: " + String.join(", ", item.getSelectedOptions()), MARGIN + 14, y);
            y -= lh;
        }

        drawText(cs, font, fontSize, "수량: " + item.getQuantity() + "개", MARGIN + 14, y);
        y -= lh;
        drawText(cs, font, fontSize, "소계 (마진 적용 전): " + formatNumber(item.getBaseTotal()) + "원", MARGIN + 14, y);
        y -= lh;
        if (item.getMargin() != null && item.getMarginAmount() > 0) {
            drawText(cs, font, fontSize,
                    "회사 마진 (" + item.getMargin() + "%): +" + formatNumber(item.getMarginAmount()) + "원",
                    MARGIN + 14, y);
            y -= lh;
        }
        drawText(cs, font, fontSize, "최종 소계: " + formatNumber(item.getFinalTotal()) + "원", MARGIN + 14, y);
        y -= lh + 4;

        cs.setStrokingColor(200f / 255f, 200f / 255f, 200f / 255f);
        cs.moveTo(MARGIN, y);
        cs.lineTo(PAGE_W - MARGIN, y);
        cs.stroke();
        y -= lh;
        return y;
    }

    private static void drawText(PDPageContentStream cs, PDType0Font font, float fontSize, String text, float x, float y) throws IOException {
        if (text == null || text.isEmpty()) return;
        cs.beginText();
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }

    private static String nvl(String s) { return s == null ? "" : s; }
    private static String nvl(String s, String def) { return (s != null && !s.isEmpty()) ? s : def; }

    private static String joinNonEmpty(String sep, String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (p != null && !p.isEmpty()) {
                if (sb.length() > 0) sb.append(sep);
                sb.append(p);
            }
        }
        return sb.toString();
    }

    private static String formatNumber(long n) { return String.format("%,d", n); }
}
