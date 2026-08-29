import type { GoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-table-response.dto';
import type { AddPurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/add-purchase-order-item.dto';
import type { ChangePurchaseOrderExchangeRateDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import type { ChangePurchaseOrderSupplierDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import type { CreatePurchaseOrderDto } from '@commerce/purchase-orders/dto/request/create-purchase-order.dto';
import type { SendPurchaseOrderEmailDto } from '@commerce/purchase-orders/dto/request/send-purchase-order-email.dto';
import type { UpdatePurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-item.dto';
import type { UpdatePurchaseOrderNotesDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-notes.dto';
import type { PurchaseOrderItemResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-item-response.dto';
import type { PurchaseOrderItemTableResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-item-table-response.dto';
import type { PurchaseOrderResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-response.dto';
import type { PurchaseOrderTableResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-table-response.dto';
import { BrevoClient, BrevoError, BrevoTimeoutError } from '@getbrevo/brevo';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { SiteDomainService } from '@/modules/domain/site/services/site.service';
import {
  buildPurchaseOrderEmailHtml,
  buildPurchaseOrderEmailText,
  type PurchaseOrderEmailData,
  type SupplierEmailData,
} from '../templates/purchase-order.email';

@Injectable()
export class PurchaseOrdersGatewayService {
  private readonly logger = new Logger(PurchaseOrdersGatewayService.name);
  private readonly brevoClient: BrevoClient;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly configService: ConfigService,
    private readonly siteService: SiteDomainService,
  ) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    const senderEmail = this.configService.get<string>('SENDER_EMAIL');
    const senderName = this.configService.get<string>('SENDER_NAME');

    if (!apiKey || !senderEmail || !senderName) {
      throw new Error('Missing email configuration for purchase order emails.');
    }

    this.brevoClient = new BrevoClient({ apiKey, maxRetries: 3 });
    this.senderEmail = senderEmail;
    this.senderName = senderName;
  }

  // Returns paginated purchase orders for the data table
  async findForTable(userId: string): Promise<PurchaseOrderTableResponseDto> {
    this.logger.log('site.purchaseOrders.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-purchase-orders',
    );

    const { result, count } = await this.nats.send<{ result: PurchaseOrderResponseDto[]; count: number }>(
      'commerce',
      'site.purchaseOrders.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new purchase order
  async create(dto: CreatePurchaseOrderDto): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.create', dto);
  }

  // Finds a purchase order by ID
  async findById(id: string): Promise<PurchaseOrderResponseDto> {
    this.logger.log(`purchaseOrders.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.findById', { id });
  }

  // Returns inventory item IDs for a purchase order
  async findItemIds(id: string): Promise<string[]> {
    this.logger.log(`purchaseOrders.itemIds — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.itemIds', { id });
  }

  // Returns line items table for a purchase order using persisted table state
  async findItemsTable(id: string, userId: string): Promise<PurchaseOrderItemTableResponseDto> {
    this.logger.log(`purchaseOrders.itemsTable — id: ${id}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-purchase-order-${id}-items`,
    );
    const { result, count } = await this.nats.send<{ result: PurchaseOrderItemResponseDto[]; count: number }>(
      'commerce',
      'site.purchaseOrders.itemsTable',
      { id, ...state },
    );
    return { result, count, state, activeViewId };
  }

  async findGoodsReceiptTable(id: string, userId: string): Promise<GoodsReceiptTableResponseDto> {
    this.logger.log(`purchaseOrders.goodsReceipts — id: ${id}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-purchase-order-${id}-goods-receipts`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptResponseDto[]; count: number }>(
      'commerce',
      'site.purchaseOrders.goodsReceipts',
      { purchaseOrderId: id, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Adds a line item to a purchase order
  async addItem(id: string, dto: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log(`purchaseOrders.addItem — id: ${id}, supplierItemId: ${dto.supplierItemId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.addItem', { id, ...dto });
  }

  // Updates a line item on a purchase order
  async updateItem(id: string, itemId: string, dto: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateItem — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.updateItem', { id, itemId, ...dto });
  }

  // Removes a line item from a purchase order
  async removeItem(id: string, itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.removeItem — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.removeItem', { id, itemId });
  }

  // Updates purchase order notes
  async updateNotes(id: string, dto: UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateNotes — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.updateNotes', { id, notes: dto.notes ?? null });
  }

  // Changes purchase order supplier
  async changeSupplier(id: string, dto: ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.changeSupplier — id: ${id}, supplier: ${dto.supplierId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.changeSupplier', { id, supplierId: dto.supplierId });
  }

  // Changes purchase order exchange rate policy / value
  async changeExchangeRate(id: string, dto: ChangePurchaseOrderExchangeRateDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.changeExchangeRate — id: ${id}, type: ${dto.exchangeRateType}`);
    return this.nats.send('commerce', 'site.purchaseOrders.changeExchangeRate', { id, ...dto });
  }

  // Closes a purchase order short — no further receipts expected
  async closePurchaseOrder(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.closeShort — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.closeShort', { id });
  }

  // Updates a purchase order status
  async updateStatus(id: string, status: string): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateStatus — id: ${id}, status: ${status}`);
    return this.nats.send('commerce', 'site.purchaseOrders.updateStatus', { id, status });
  }

  // Sends a purchase order email with PDF attachment and marks draft POs as sent
  async sendEmail(id: string, dto: SendPurchaseOrderEmailDto): Promise<SuccessResponseDto> {
    const [po, items] = await Promise.all([
      this.nats.send<PurchaseOrderResponseDto>('commerce', 'site.purchaseOrders.findById', { id }),
      this.nats.send<PurchaseOrderItemResponseDto[]>('commerce', 'site.purchaseOrders.items', { id }),
    ]);
    const totalAmountValue = Number(po.totalAmount?.value ?? 0);
    if (po.status === 'DRAFT' && (!Number.isFinite(totalAmountValue) || totalAmountValue <= 0)) {
      throw new BadRequestException({
        label: 'Cannot Mark as Sent',
        detail: 'Purchase order total amount must be greater than 0 before sending the purchase order email.',
      });
    }
    const supplier = await this.nats.send<SupplierEmailData>('commerce', 'le.suppliers.findById', {
      id: po.supplierId,
    });
    const recipientEmail = dto.email?.trim() || supplier.email || null;

    if (!recipientEmail) {
      throw new BadRequestException({
        label: 'Missing Recipient Email',
        detail: 'Supplier email is not available. Provide a recipient email to send this purchase order.',
      });
    }

    const poEmailData: PurchaseOrderEmailData = {
      poNumber: po.poNumber,
      status: po.status,
      orderDate: po.orderDate,
      expectedBy: po.expectedBy,
      notes: po.notes,
      totalAmount: po.totalAmount,
      items,
    };

    const htmlContent = buildPurchaseOrderEmailHtml(poEmailData, supplier);
    const textContent = buildPurchaseOrderEmailText(poEmailData, supplier);
    const pdfBuffer = await this.buildPurchaseOrderPdf(poEmailData, supplier, null);
    const attachmentName = `${(po.poNumber ?? 'purchase-order').replaceAll(/\s+/g, '-')}.pdf`;

    try {
      await this.brevoClient.transactionalEmails.sendTransacEmail({
        sender: { email: this.senderEmail, name: this.senderName },
        to: [{ email: recipientEmail, name: supplier.name ?? undefined }],
        subject: `Purchase Order ${po.poNumber ?? ''}`.trim(),
        htmlContent,
        textContent,
        attachment: [{ name: attachmentName, content: pdfBuffer.toString('base64') }],
      });
    } catch (error) {
      if (error instanceof BrevoTimeoutError) {
        throw new InternalServerErrorException('Failed to send purchase order email: timeout');
      }
      if (error instanceof BrevoError) {
        throw new InternalServerErrorException(`Failed to send purchase order email: ${error.message}`);
      }
      throw error;
    }

    if (po.status === 'DRAFT') {
      await this.updateStatus(id, 'SENT');
    }

    this.logger.log(`purchaseOrders.sendEmail — id: ${id}, recipient: ${recipientEmail}`);
    return { success: true, message: 'Purchase order email sent successfully.' };
  }

  // Deletes a purchase order by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.delete', { id });
  }

  // Generates and returns a PDF buffer + filename for streaming to the client
  async downloadPdf(id: string, siteId: string): Promise<{ buffer: Buffer; filename: string }> {
    const [po, items] = await Promise.all([
      this.nats.send<PurchaseOrderResponseDto>('commerce', 'site.purchaseOrders.findById', { id }),
      this.nats.send<PurchaseOrderItemResponseDto[]>('commerce', 'site.purchaseOrders.items', { id }),
    ]);
    const [supplier, site] = await Promise.all([
      this.nats.send<SupplierEmailData>('commerce', 'le.suppliers.findById', { id: po.supplierId }),
      siteId ? this.siteService.findById(siteId).catch(() => null) : Promise.resolve(null),
    ]);
    const buffer = await this.buildPurchaseOrderPdf(
      {
        poNumber: po.poNumber,
        status: po.status,
        orderDate: po.orderDate,
        expectedBy: po.expectedBy,
        notes: po.notes,
        totalAmount: po.totalAmount,
        items,
      },
      supplier,
      site?.name ?? null,
    );
    const filename = `${(po.poNumber ?? 'purchase-order').replaceAll(/\s+/g, '-')}.pdf`;
    return { buffer, filename };
  }

  // Generates a professional A4 purchase order PDF
  private async buildPurchaseOrderPdf(
    po: PurchaseOrderEmailData,
    supplier: SupplierEmailData,
    siteName: string | null,
  ): Promise<Buffer> {
    // Color constants
    const BLACK = rgb(0.067, 0.094, 0.153);
    const DARK = rgb(0.122, 0.161, 0.216);
    const GRAY = rgb(0.42, 0.447, 0.502);
    const LIGHT_GRAY = rgb(0.976, 0.98, 0.984);
    const BORDER = rgb(0.898, 0.914, 0.922);
    const WHITE = rgb(1, 1, 1);

    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const MARGIN = 40;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const addPage = () => pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let page = addPage();

    // Helpers
    const formatDate = (value: string | null): string => {
      if (!value) return '-';
      return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    const formatAmount = (value: { currency: string; value: string } | null): string => {
      if (value == null) return '-';
      return `${value.currency} ${value.value}`;
    };
    const truncate = (text: string, maxWidth: number, size: number, f: typeof font): string => {
      if (f.widthOfTextAtSize(text, size) <= maxWidth) return text;
      let result = text;
      while (result.length > 1 && f.widthOfTextAtSize(`${result}…`, size) > maxWidth) {
        result = result.slice(0, -1);
      }
      return `${result}…`;
    };

    // --- HEADER ---
    const headerY = 800;
    const businessName = siteName ?? 'Your Business';
    page.drawText(businessName, { x: MARGIN, y: headerY, size: 22, font: boldFont, color: BLACK });
    const poLabel = 'PURCHASE ORDER';
    const poLabelWidth = boldFont.widthOfTextAtSize(poLabel, 20);
    page.drawText(poLabel, {
      x: PAGE_WIDTH - MARGIN - poLabelWidth,
      y: headerY,
      size: 20,
      font: boldFont,
      color: DARK,
    });
    const poNumberText = po.poNumber ?? '-';
    const poNumberWidth = font.widthOfTextAtSize(poNumberText, 11);
    page.drawText(poNumberText, {
      x: PAGE_WIDTH - MARGIN - poNumberWidth,
      y: headerY - 26,
      size: 11,
      font,
      color: GRAY,
    });

    // Thick divider
    const dividerY = 745;
    page.drawRectangle({ x: MARGIN, y: dividerY, width: CONTENT_WIDTH, height: 2, color: DARK });

    // --- META GRID ---
    const metaY = 730;
    const boxWidth = (CONTENT_WIDTH - 12) / 2;
    const boxHeight = 72;

    // Supplier box
    page.drawRectangle({
      x: MARGIN,
      y: metaY - boxHeight,
      width: boxWidth,
      height: boxHeight,
      color: LIGHT_GRAY,
      borderColor: BORDER,
      borderWidth: 1,
    });
    page.drawText('SUPPLIER', { x: MARGIN + 10, y: metaY - 16, size: 8, font: boldFont, color: GRAY });
    const supplierName = truncate(supplier.name ?? '-', boxWidth - 20, 11, boldFont);
    page.drawText(supplierName, { x: MARGIN + 10, y: metaY - 30, size: 11, font: boldFont, color: BLACK });
    if (supplier.email) {
      const supplierEmail = truncate(supplier.email, boxWidth - 20, 9, font);
      page.drawText(supplierEmail, { x: MARGIN + 10, y: metaY - 44, size: 9, font, color: GRAY });
    }

    // Order details box
    const detailsBoxX = MARGIN + boxWidth + 12;
    page.drawRectangle({
      x: detailsBoxX,
      y: metaY - boxHeight,
      width: boxWidth,
      height: boxHeight,
      color: LIGHT_GRAY,
      borderColor: BORDER,
      borderWidth: 1,
    });
    page.drawText('ORDER DETAILS', { x: detailsBoxX + 10, y: metaY - 16, size: 8, font: boldFont, color: GRAY });

    const detailRows = [
      { label: 'PO Number', value: po.poNumber ?? '-' },
      { label: 'Order Date', value: formatDate(po.orderDate) },
      { label: 'Expected By', value: formatDate(po.expectedBy) },
      { label: 'Status', value: po.status },
    ];
    const detailRowHeight = 13;
    const detailsRightEdge = detailsBoxX + boxWidth - 10;
    detailRows.forEach((row, i) => {
      const rowY = metaY - 32 - i * detailRowHeight;
      page.drawText(row.label, { x: detailsBoxX + 10, y: rowY, size: 9, font, color: GRAY });
      const valueWidth = font.widthOfTextAtSize(row.value, 9);
      page.drawText(row.value, { x: detailsRightEdge - valueWidth, y: rowY, size: 9, font, color: BLACK });
    });

    // --- LINE ITEMS TABLE ---
    const tableTopY = metaY - boxHeight - 16;
    const colNum = 30;
    const colDesc = 200;
    const colQty = 70;
    const colUnitPrice = 70;
    const colAmount = 80;
    const rowHeight = 22;

    // Table header
    page.drawRectangle({ x: MARGIN, y: tableTopY - rowHeight, width: CONTENT_WIDTH, height: rowHeight, color: DARK });
    const headers = [
      { label: '#', x: MARGIN + 8, align: 'left' as const },
      { label: 'ITEM DESCRIPTION', x: MARGIN + colNum + 8, align: 'left' as const },
      { label: 'QTY ORDERED', x: MARGIN + colNum + colDesc + colQty - 8, align: 'right' as const },
      { label: 'UNIT PRICE', x: MARGIN + colNum + colDesc + colQty + colUnitPrice - 8, align: 'right' as const },
      {
        label: 'AMOUNT',
        x: MARGIN + colNum + colDesc + colQty + colUnitPrice + colAmount - 8,
        align: 'right' as const,
      },
    ];
    for (const h of headers) {
      const w = boldFont.widthOfTextAtSize(h.label, 8);
      const hx = h.align === 'right' ? h.x - w : h.x;
      page.drawText(h.label, { x: hx, y: tableTopY - rowHeight + 7, size: 8, font: boldFont, color: WHITE });
    }

    // Draw vertical column lines in header
    const colXPositions = [
      MARGIN + colNum,
      MARGIN + colNum + colDesc,
      MARGIN + colNum + colDesc + colQty,
      MARGIN + colNum + colDesc + colQty + colUnitPrice,
    ];
    for (const cx of colXPositions) {
      page.drawLine({
        start: { x: cx, y: tableTopY },
        end: { x: cx, y: tableTopY - rowHeight },
        thickness: 0.5,
        color: GRAY,
      });
    }

    // Data rows
    const resolveTotalAmountDisplay = (): string => {
      if (po.totalAmount != null) return formatAmount(po.totalAmount);
      const currency = po.items.find((i) => i.totalPrice != null)?.totalPrice?.currency ?? '';
      const sum = po.items.reduce((acc, item) => acc + Number(item.totalPrice?.value ?? 0), 0);
      return currency ? `${currency} ${sum.toFixed(2)}` : '-';
    };
    const totalAmountDisplay = resolveTotalAmountDisplay();
    let currentY = tableTopY - rowHeight;

    for (const [index, item] of po.items.entries()) {
      // Start new page if not enough room for row + totals section (approx 120pt)
      if (currentY - rowHeight < 120) {
        page = addPage();
        currentY = PAGE_HEIGHT - MARGIN;
      }

      const rowY = currentY - rowHeight;
      const isEven = index % 2 === 1;
      if (isEven) {
        page.drawRectangle({ x: MARGIN, y: rowY, width: CONTENT_WIDTH, height: rowHeight, color: LIGHT_GRAY });
      }
      // Bottom border for row
      page.drawLine({
        start: { x: MARGIN, y: rowY },
        end: { x: MARGIN + CONTENT_WIDTH, y: rowY },
        thickness: 0.5,
        color: BORDER,
      });

      const textY = rowY + 7;
      const itemName = truncate(item.inventoryItemName ?? item.inventoryItemId, colDesc - 16, 9, font);
      page.drawText(String(index + 1), { x: MARGIN + 8, y: textY, size: 9, font, color: BLACK });
      page.drawText(itemName, { x: MARGIN + colNum + 8, y: textY, size: 9, font, color: BLACK });

      const qtyText = String(item.uomQty);
      const qtyX = MARGIN + colNum + colDesc + colQty - 8 - font.widthOfTextAtSize(qtyText, 9);
      page.drawText(qtyText, { x: qtyX, y: textY, size: 9, font, color: BLACK });

      const unitText = formatAmount(item.unitPrice);
      const unitX = MARGIN + colNum + colDesc + colQty + colUnitPrice - 8 - font.widthOfTextAtSize(unitText, 9);
      page.drawText(unitText, { x: unitX, y: textY, size: 9, font, color: BLACK });

      const amtText = formatAmount(item.totalPrice);
      const amtX =
        MARGIN + colNum + colDesc + colQty + colUnitPrice + colAmount - 8 - font.widthOfTextAtSize(amtText, 9);
      page.drawText(amtText, { x: amtX, y: textY, size: 9, font, color: BLACK });

      // Vertical column separators
      for (const cx of colXPositions) {
        page.drawLine({ start: { x: cx, y: currentY }, end: { x: cx, y: rowY }, thickness: 0.5, color: BORDER });
      }

      currentY = rowY;
    }

    // Table bottom border
    page.drawLine({
      start: { x: MARGIN, y: currentY },
      end: { x: MARGIN + CONTENT_WIDTH, y: currentY },
      thickness: 1,
      color: BORDER,
    });

    // --- TOTALS ---
    const totalsX = PAGE_WIDTH - MARGIN - 200;
    const totalsWidth = 200;
    let totalsY = currentY - 12;

    // Subtotal row
    const subtotalLabel = 'Subtotal';
    const subtotalValue = totalAmountDisplay;
    page.drawText(subtotalLabel, { x: totalsX + 10, y: totalsY, size: 9, font, color: GRAY });
    const subtotalValueWidth = font.widthOfTextAtSize(subtotalValue, 9);
    page.drawText(subtotalValue, {
      x: totalsX + totalsWidth - 10 - subtotalValueWidth,
      y: totalsY,
      size: 9,
      font,
      color: BLACK,
    });

    // Thin divider
    totalsY -= 14;
    page.drawLine({
      start: { x: totalsX, y: totalsY },
      end: { x: totalsX + totalsWidth, y: totalsY },
      thickness: 0.5,
      color: BORDER,
    });
    totalsY -= 4;

    // Total row with dark background
    const totalRowHeight = 22;
    page.drawRectangle({
      x: totalsX,
      y: totalsY - totalRowHeight,
      width: totalsWidth,
      height: totalRowHeight,
      color: DARK,
    });
    const totalLabel = 'TOTAL';
    page.drawText(totalLabel, {
      x: totalsX + 10,
      y: totalsY - totalRowHeight + 7,
      size: 10,
      font: boldFont,
      color: WHITE,
    });
    const totalValueText = totalAmountDisplay;
    const totalValueWidth = boldFont.widthOfTextAtSize(totalValueText, 10);
    page.drawText(totalValueText, {
      x: totalsX + totalsWidth - 10 - totalValueWidth,
      y: totalsY - totalRowHeight + 7,
      size: 10,
      font: boldFont,
      color: WHITE,
    });

    let contentY = totalsY - totalRowHeight - 20;

    // --- NOTES ---
    if (po.notes) {
      page.drawText('NOTES', { x: MARGIN, y: contentY, size: 8, font: boldFont, color: GRAY });
      contentY -= 14;
      const notesBoxHeight = 36;
      page.drawRectangle({
        x: MARGIN,
        y: contentY - notesBoxHeight,
        width: CONTENT_WIDTH,
        height: notesBoxHeight,
        color: LIGHT_GRAY,
        borderColor: BORDER,
        borderWidth: 0.5,
      });
      const notesText = truncate(po.notes, CONTENT_WIDTH - 20, 9, font);
      page.drawText(notesText, { x: MARGIN + 10, y: contentY - 16, size: 9, font, color: BLACK });
      contentY -= notesBoxHeight + 20;
    }

    // --- TERMS ---
    page.drawText('TERMS & CONDITIONS', { x: MARGIN, y: contentY, size: 8, font: boldFont, color: GRAY });
    contentY -= 14;
    const termsText =
      'All goods must be delivered per the specifications in this purchase order. Payment terms are subject to the agreed supplier contract.';
    const termsText2 = 'The supplier must notify the buyer of any delays or substitutions prior to delivery.';
    page.drawText(truncate(termsText, CONTENT_WIDTH, 8, font), { x: MARGIN, y: contentY, size: 8, font, color: GRAY });
    contentY -= 12;
    page.drawText(truncate(termsText2, CONTENT_WIDTH, 8, font), { x: MARGIN, y: contentY, size: 8, font, color: GRAY });

    // --- SIGNATURE SECTION ---
    const sigY = 120;
    const sigColWidth = (CONTENT_WIDTH - 40) / 2;
    const sig1X = MARGIN;
    const sig2X = MARGIN + sigColWidth + 40;

    page.drawText('Authorized by', { x: sig1X, y: sigY + 20, size: 9, font, color: GRAY });
    page.drawLine({
      start: { x: sig1X, y: sigY },
      end: { x: sig1X + sigColWidth, y: sigY },
      thickness: 0.5,
      color: DARK,
    });
    page.drawText('Name / Signature / Date', { x: sig1X, y: sigY - 12, size: 8, font, color: GRAY });

    page.drawText('Accepted by (Supplier)', { x: sig2X, y: sigY + 20, size: 9, font, color: GRAY });
    page.drawLine({
      start: { x: sig2X, y: sigY },
      end: { x: sig2X + sigColWidth, y: sigY },
      thickness: 0.5,
      color: DARK,
    });
    page.drawText('Name / Signature / Date', { x: sig2X, y: sigY - 12, size: 8, font, color: GRAY });

    // --- FOOTER ---
    const generatedOn = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const footerText = `Generated on ${generatedOn} · ${po.poNumber ?? 'Purchase Order'}`;
    const footerWidth = font.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, { x: (PAGE_WIDTH - footerWidth) / 2, y: 45, size: 8, font, color: GRAY });

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }
}
