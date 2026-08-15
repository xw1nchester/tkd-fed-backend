import ExcelJS from 'exceljs';

export interface TournamentRequestXlsxAthlete {
    gender: string;
    fullName: string;
    birthDate: Date;
    weightCategory: string;
    ageCategory: string;
    sportRank: string;
    belt: string;
    city: string;
    federalDistrict: string;
    department: string;
    organization: string;
    firstTrainer: string;
}

export interface TournamentRequestXlsxData {
    tournamentName: string;
    tournamentCity: string;
    startDate: Date;
    endDate: Date;
    approvalOrganizationLine1?: string;
    approvalOrganizationLine2?: string;
    approvalPersonName?: string;
    representativeName: string;
    athletes: TournamentRequestXlsxAthlete[];
}

const MONTHS = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря'
];

const TABLE_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
};

const BASE_FONT: Partial<ExcelJS.Font> = {
    name: 'Times New Roman',
    size: 10
};

export async function buildTournamentRequestXlsx(
    data: TournamentRequestXlsxData
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'tkd-fed-backend';
    workbook.lastModifiedBy = 'tkd-fed-backend';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Заявка', {
        pageSetup: {
            orientation: 'landscape',
            margins: {
                left: 0.25,
                right: 0.25,
                top: 0.4,
                bottom: 0.4,
                header: 0.3,
                footer: 0.3
            }
        }
    });

    sheet.columns = [
        { key: 'index', width: 5 },
        { key: 'gender', width: 5 },
        { key: 'fullName', width: 34 },
        { key: 'birthDate', width: 13 },
        { key: 'weightCategory', width: 11 },
        { key: 'sportRank', width: 15 },
        { key: 'belt', width: 15 },
        { key: 'city', width: 12 },
        { key: 'federalDistrict', width: 12 },
        { key: 'department', width: 12 },
        { key: 'organization', width: 21 },
        { key: 'firstTrainer', width: 24 },
        { key: 'doctorVisa', width: 22 }
    ];

    addApprovalBlock(sheet, data);
    addTitleBlock(sheet, data);
    addTable(sheet, data.athletes);
    addFooter(sheet, data);

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

function addApprovalBlock(
    sheet: ExcelJS.Worksheet,
    data: TournamentRequestXlsxData
) {
    const values = [
        '"Утверждаю"',
        data.approvalOrganizationLine1 ?? '',
        data.approvalOrganizationLine2 ?? '',
        data.approvalPersonName ?? '',
        '____________________'
    ];

    values.forEach((value, index) => {
        const row = index + 1;
        sheet.mergeCells(`L${row}:M${row}`);
        const cell = sheet.getCell(`L${row}`);
        cell.value = value;
        cell.font = BASE_FONT;
        cell.alignment = {
            horizontal: 'left',
            vertical: 'middle',
            wrapText: true
        };
    });
}

function addTitleBlock(
    sheet: ExcelJS.Worksheet,
    data: TournamentRequestXlsxData
) {
    sheet.mergeCells('A7:M7');
    sheet.getRow(7).height = 22;
    const titleCell = sheet.getCell('A7');
    titleCell.value = 'Заявка';
    titleCell.font = { ...BASE_FONT, bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A8:M8');
    sheet.getRow(8).height = 38;
    const subtitleCell = sheet.getCell('A8');
    subtitleCell.value = `на участие в ${data.tournamentName}\n${formatDateRange(data.startDate, data.endDate)} г.${data.tournamentCity}`;
    subtitleCell.font = { ...BASE_FONT, bold: true, size: 11 };
    subtitleCell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
    };
}

function addTable(
    sheet: ExcelJS.Worksheet,
    athletes: TournamentRequestXlsxAthlete[]
) {
    const headerRow = sheet.getRow(10);
    headerRow.height = 33;
    headerRow.values = [
        '№',
        'Пол',
        'Ф. И. О.',
        'Дата рождения',
        'Весовая категория',
        'Спортивная квалификация',
        'Техническая квалификация',
        'Город',
        'Фед. Округ',
        'Д.С.О., Ведомство',
        'Организация',
        'Ф. И. О. тренера',
        'Виза врача'
    ];
    styleRow(headerRow, {
        font: BASE_FONT,
        border: TABLE_BORDER,
        alignment: {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true
        }
    });

    let rowNumber = 11;
    let athleteIndex = 1;

    for (const [ageCategory, group] of groupByAgeCategory(athletes)) {
        const categoryRow = sheet.getRow(rowNumber);
        categoryRow.height = 18;
        sheet.mergeCells(`A${rowNumber}:M${rowNumber}`);
        const categoryCell = categoryRow.getCell(1);
        categoryCell.value = ageCategory;
        categoryCell.font = { ...BASE_FONT, bold: true, size: 11 };
        categoryCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        styleRow(categoryRow, {
            font: { ...BASE_FONT, bold: true, size: 11 },
            border: TABLE_BORDER,
            alignment: {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true
            }
        });
        rowNumber++;

        for (const athlete of group) {
            const row = sheet.getRow(rowNumber);
            row.height = 26;
            row.values = [
                athleteIndex,
                athlete.gender,
                athlete.fullName,
                formatDate(athlete.birthDate),
                athlete.weightCategory,
                athlete.sportRank,
                athlete.belt,
                athlete.city,
                athlete.federalDistrict,
                athlete.department,
                athlete.organization,
                athlete.firstTrainer,
                ''
            ];
            styleRow(row, {
                font: BASE_FONT,
                border: TABLE_BORDER,
                alignment: {
                    horizontal: 'center',
                    vertical: 'middle',
                    wrapText: true
                }
            });
            row.getCell(3).alignment = {
                horizontal: 'left',
                vertical: 'middle',
                wrapText: true
            };

            rowNumber++;
            athleteIndex++;
        }
    }
}

function addFooter(sheet: ExcelJS.Worksheet, data: TournamentRequestXlsxData) {
    const footerRow = sheet.lastRow.number + 4;
    const cell = sheet.getCell(`C${footerRow}`);
    cell.value = `Представитель команды ${data.representativeName}________________`;
    cell.font = { ...BASE_FONT, bold: true, size: 11 };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
}

function styleRow(row: ExcelJS.Row, style: Partial<ExcelJS.Style>) {
    for (let col = 1; col <= 13; col++) {
        const cell = row.getCell(col);
        cell.font = style.font;
        cell.border = style.border;
        cell.alignment = style.alignment;
    }
}

function groupByAgeCategory(
    athletes: TournamentRequestXlsxAthlete[]
): Map<string, TournamentRequestXlsxAthlete[]> {
    const groups = new Map<string, TournamentRequestXlsxAthlete[]>();

    for (const athlete of athletes) {
        const key = athlete.ageCategory || 'Без возрастной категории';
        groups.set(key, [...(groups.get(key) ?? []), athlete]);
    }

    return groups;
}

function formatDate(date?: Date): string {
    if (!date) {
        return '';
    }

    return [
        date.getDate().toString().padStart(2, '0'),
        (date.getMonth() + 1).toString().padStart(2, '0'),
        date.getFullYear()
    ].join('.');
}

function formatDateRange(startDate: Date, endDate: Date): string {
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = MONTHS[startDate.getMonth()];
    const endMonth = MONTHS[endDate.getMonth()];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    if (
        startDate.toDateString() === endDate.toDateString() ||
        startDate.getTime() === endDate.getTime()
    ) {
        return `${startDay} ${startMonth} ${startYear} год`;
    }

    if (startMonth === endMonth && startYear === endYear) {
        return `${startDay}-${endDay} ${startMonth} ${startYear} год`;
    }

    if (startYear === endYear) {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear} год`;
    }

    return `${startDay} ${startMonth} ${startYear} год - ${endDay} ${endMonth} ${endYear} год`;
}
