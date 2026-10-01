// src/controllers/pdfController.js
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const registrarLog = require("../utils/logger"); 

exports.gerarDocumento = async (req, res) => {
    const { modeloId, dadosFormulario } = req.body;

    if (!modeloId || !dadosFormulario) {
        return res.status(400).json({ message: "Faltam dados para gerar o documento." });
    }

    try {
        const [rows] = await db.query("SELECT texto_base, nome_modelo FROM modelo WHERE id = ?", [modeloId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "Modelo de documento não encontrado." });
        }

        let textoFormatado = rows[0].texto_base;
        const tituloDocumento = rows[0].nome_modelo;

        // Substitui as tags {{ }} pelos valores do front-end
        for (const [chave, valor] of Object.entries(dadosFormulario)) {
            const tag = new RegExp(`{{${chave}}}`, 'gi');
            textoFormatado = textoFormatado.replace(tag, valor);
        }

        const pdfDoc = await PDFDocument.create();
        
        // --- 1. CARREGANDO O CABEÇALHO (JPEG) ---
        const imagePath = path.join(__dirname, '../assets/cabecalhocartorio.jpeg');
        let cabecalhoImage = null;
        let cabecalhoDims = { width: 0, height: 0 };

        try {
            if (fs.existsSync(imagePath)) {
                const imageBytes = fs.readFileSync(imagePath);
                cabecalhoImage = await pdfDoc.embedJpg(imageBytes);
                
                // A largura útil da página A4 (595.28) descontando as margens de 50 de cada lado = 495.28
                // Ele redimensiona a imagem proporcionalmente para caber nessa largura.
                cabecalhoDims = cabecalhoImage.scaleToFit(495.28, 200); 
            }
        } catch (err) {
            console.error("Erro ao carregar a imagem do cabeçalho:", err);
        }

        // Define as fontes e inicia a PRIMEIRA página
        const fontText = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        let page = pdfDoc.addPage([595.28, 841.89]); // Tamanho A4

        const { width, height } = page.getSize();
        
        // --- 2. CÁLCULO DE MARGENS DINÂMICAS ---
        // Se a imagem existir, a margem do topo desce. Se não, fica com margem padrão (para papel pré-impresso).
        const margemSuperiorTexto = cabecalhoDims.height > 0 ? cabecalhoDims.height + 60 : 120;
        
        // Título Centralizado
        const tituloSize = 16;
        const tituloWidth = fontTitle.widthOfTextAtSize(tituloDocumento, tituloSize);
        page.drawText(tituloDocumento, {
            x: (width - tituloWidth) / 2, 
            y: height - margemSuperiorTexto,
            size: tituloSize,
            font: fontTitle,
            color: rgb(0, 0, 0),
        });

        // --- 3. MOTOR DE JUSTIFICAÇÃO E PAGINAÇÃO ---
        const fontSize = 12;
        const startX = 50; // Margem Esquerda
        const maxWidth = width - 100; // Largura útil para o texto
        const lineHeight = 18;
        let currentY = height - margemSuperiorTexto - 40; // Começa a escrever abaixo do título
        const bottomMargin = 60; // Distância do rodapé para criar nova página

        const paragraphs = textoFormatado.split('\n');

        for (const paragraph of paragraphs) {
            const cleanParagraph = paragraph.replace(/\r/g, '');

            if (cleanParagraph.trim() === '') {
                currentY -= lineHeight;
                if (currentY < bottomMargin) {
                    page = pdfDoc.addPage([595.28, 841.89]);
                    currentY = height - margemSuperiorTexto;
                }
                continue;
            }

            const words = cleanParagraph.split(' ');
            let currentLine = [];
            let currentLineWidth = 0;
            const spaceWidth = fontText.widthOfTextAtSize(' ', fontSize);

            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const wordWidth = fontText.widthOfTextAtSize(word, fontSize);

                if (currentLine.length === 0 && wordWidth > maxWidth) {
                    currentLine.push(word);
                    currentLineWidth += wordWidth;
                    continue;
                }

                if (currentLine.length > 0 && (currentLineWidth + wordWidth + (currentLine.length * spaceWidth)) > maxWidth) {
                    const totalWordWidth = currentLine.reduce((sum, w) => sum + fontText.widthOfTextAtSize(w, fontSize), 0);
                    const totalSpaceToDistribute = maxWidth - totalWordWidth;
                    const spacePerGap = currentLine.length > 1 ? totalSpaceToDistribute / (currentLine.length - 1) : 0;

                    let currentX = startX;
                    for (const w of currentLine) {
                        page.drawText(w, { x: currentX, y: currentY, size: fontSize, font: fontText, color: rgb(0, 0, 0) });
                        currentX += fontText.widthOfTextAtSize(w, fontSize) + spacePerGap; 
                    }

                    currentY -= lineHeight;
                    
                    if (currentY < bottomMargin) {
                        page = pdfDoc.addPage([595.28, 841.89]);
                        currentY = height - margemSuperiorTexto;
                    }

                    currentLine = [word];
                    currentLineWidth = wordWidth;
                } else {
                    currentLine.push(word);
                    currentLineWidth += wordWidth;
                }
            }

            if (currentLine.length > 0) {
                let currentX = startX;
                for (const w of currentLine) {
                    page.drawText(w, { x: currentX, y: currentY, size: fontSize, font: fontText, color: rgb(0, 0, 0) });
                    currentX += fontText.widthOfTextAtSize(w, fontSize) + spaceWidth;
                }
                
                currentY -= lineHeight;
                
                if (currentY < bottomMargin) {
                    page = pdfDoc.addPage([595.28, 841.89]);
                    currentY = height - margemSuperiorTexto;
                }
            }
        }

        // --- 4. APLICANDO O CABEÇALHO EM TODAS AS PÁGINAS ---
        if (cabecalhoImage) {
            const todasAsPaginas = pdfDoc.getPages();
            todasAsPaginas.forEach(p => {
                p.drawImage(cabecalhoImage, {
                    x: 50, // Centralizado baseado na margem
                    y: p.getSize().height - cabecalhoDims.height - 30, // 30px de respiro no topo da folha
                    width: cabecalhoDims.width,
                    height: cabecalhoDims.height,
                });
            });
        }

        const pdfBytes = await pdfDoc.save();
        
        // 📢 DISPARA O LOG AQUI
        await registrarLog(req, "GEROU_PDF", `Gerou o documento: ${tituloDocumento}`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${tituloDocumento}.pdf"`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        res.status(500).json({ message: "Erro interno ao processar o documento." });
    }
};