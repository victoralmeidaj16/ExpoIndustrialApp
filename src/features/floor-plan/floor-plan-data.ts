export type FloorCategory =
  | 'standard'
  | 'mini'
  | 'premium'
  | 'case'
  | 'auditorium'
  | 'service'
  | 'circulation';

export type StandType =
  | 'MINI_4M2'
  | 'PADRAO_6M2'
  | 'PADRAO_8M2'
  | 'PREMIUM_9M2'
  | 'PREMIUM_12M2'
  | 'CASE_64M2'
  | 'AUDITORIO'
  | 'ENTRADA'
  | 'BANHEIRO'
  | 'SERVICO'
  | 'APICE'
  | 'AREA';

export type FloorObject = {
  id: string;
  number?: string;
  name: string;
  type?: StandType;
  category: FloorCategory;
  zone?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area?: number;
};

export type FloorPlan = {
  hall: {
    id: string;
    name: string;
    width: number;
    height: number;
  };
  zones: FloorObject[];
  stands: FloorObject[];
};

const createVerticalIsland = ({
  id,
  startNumber,
  x,
  y,
  rows = 8,
  columns = 2,
  zone,
  palette = 'standard',
}: {
  id: string;
  startNumber: number;
  x: number;
  y: number;
  rows?: number;
  columns?: number;
  zone: string;
  palette?: FloorCategory;
}): FloorObject[] => {
  const stands: FloorObject[] = [];
  const cellWidth = 28;
  const cellHeight = 25;
  const gapX = 8;
  const gapY = 5;
  let current = startNumber;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const area = row < 2 ? 8 : row > 5 ? 4 : 6;
      stands.push({
        id: `${id}-${current}`,
        number: String(current).padStart(2, '0'),
        name: `Estande ${String(current).padStart(2, '0')}`,
        type: area === 4 ? 'MINI_4M2' : area === 8 ? 'PADRAO_8M2' : 'PADRAO_6M2',
        category: palette,
        zone,
        x: x + col * (cellWidth + gapX),
        y: y + row * (cellHeight + gapY),
        width: cellWidth,
        height: cellHeight,
        area,
      });
      current -= 1;
    }
  }

  return stands;
};

const createCustomColumn = ({
  startNumber,
  x,
  y,
  rows,
  colOffsetSign = 1,
  idPrefix,
  zone,
  palette = 'standard',
}: {
  startNumber: number;
  x: number;
  y: number;
  rows: number;
  colOffsetSign?: number;
  idPrefix: string;
  zone: string;
  palette?: FloorCategory;
}): FloorObject[] => {
  const stands: FloorObject[] = [];
  const rowHeight = 25;
  const standardWidth = 28;
  const gapY = 5;
  let current = startNumber;

  for (let r = 0; r < rows; r += 1) {
    let area = 6;
    let type: StandType = 'PADRAO_6M2';

    if (rows === 11) {
      if (r === 0) {
        area = 8; type = 'PADRAO_8M2';
      } else if (r === 1) {
        area = 6; type = 'PADRAO_6M2';
      } else if (r >= 2 && r <= 6) {
        area = 4; type = 'MINI_4M2';
      } else if (r === 7 || r === 8) {
        area = 6; type = 'PADRAO_6M2';
      } else {
        area = 8; type = 'PADRAO_8M2';
      }
    } else {
      if (r >= 0 && r <= 6) {
        area = 6; type = 'PADRAO_6M2';
      } else {
        area = 8; type = 'PADRAO_8M2';
      }
    }

    stands.push({
      id: `${idPrefix}-${current}`,
      number: String(current).padStart(2, '0'),
      name: `Estande ${String(current).padStart(2, '0')}`,
      type,
      category: palette,
      zone,
      x: x,
      y: y + r * (rowHeight + gapY),
      width: standardWidth,
      height: rowHeight,
      area,
    });
    current -= 1;
  }

  return stands;
};

const createRightColumn = ({
  startNumber,
  x,
  y,
  rows,
  idPrefix,
  zone,
  palette = 'standard',
}: {
  startNumber: number;
  x: number;
  y: number;
  rows: number;
  idPrefix: string;
  zone: string;
  palette?: FloorCategory;
}): FloorObject[] => {
  const stands: FloorObject[] = [];
  const rowHeight = 25;
  const standardWidth = 28;
  const gapY = 5;
  let current = startNumber;

  for (let r = 0; r < rows; r += 1) {
    const isBottomTwo = (r === rows - 1 || r === rows - 2);
    const area = isBottomTwo ? 8 : 6;
    const type: StandType = isBottomTwo ? 'PADRAO_8M2' : 'PADRAO_6M2';

    stands.push({
      id: `${idPrefix}-${current}`,
      number: String(current).padStart(2, '0'),
      name: `Estande ${String(current).padStart(2, '0')}`,
      type,
      category: palette,
      zone,
      x: x,
      y: y + r * (rowHeight + gapY),
      width: standardWidth,
      height: rowHeight,
      area,
    });
    current -= 1;
  }

  return stands;
};


const createAuditoriums = (): FloorObject[] => [
  ...[1, 2, 3, 4].map((number, index) => ({
    id: `auditorio-${number}`,
    number: String(number),
    name: `Auditório ${number}`,
    type: 'AUDITORIO' as const,
    category: 'auditorium' as const,
    zone: 'Auditórios Oeste',
    x: 55,
    y: 130 + index * 105,
    width: 54,
    height: 48,
    area: 140,
  })),
  ...[5, 6, 7, 8].map((number, index) => ({
    id: `auditorio-${number}`,
    number: String(number),
    name: `Auditório ${number}`,
    type: 'AUDITORIO' as const,
    category: 'auditorium' as const,
    zone: 'Auditórios Leste',
    x: 1240,
    y: 130 + index * 105,
    width: 42,
    height: 50,
    area: 120,
  })),
];

const createPremiumBlocks = (): FloorObject[] => {
  const numbers = [103, 97, 91, 102, 96, 90, 101, 95, 89, 100, 94, 88, 99, 93, 87, 98, 92, 86];
  const premium12 = new Set([86, 87, 88, 89, 92, 93, 94, 95, 98, 99, 100, 101, 103]);
  const columns = [520, 600, 680];
  const rows = [170, 238, 312, 386, 470, 550];

  return numbers.map((number, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const isLarge = premium12.has(number);

    return {
      id: `premium-${number}`,
      number: String(number),
      name: `Estande ${number}`,
      type: isLarge ? 'PREMIUM_12M2' : 'PREMIUM_9M2',
      category: 'premium',
      zone: 'Centro Premium',
      x: columns[col],
      y: rows[row],
      width: isLarge ? 46 : 42,
      height: isLarge ? 34 : 32,
      area: isLarge ? 12 : 9,
    } satisfies FloorObject;
  });
};

export const expoIndustrialFloorPlan: FloorPlan = {
  hall: {
    id: 'expoindustrial-sul-2026',
    name: 'Expoindustrial Sul 2026',
    width: 1300,
    height: 650,
  },
  zones: [
    { id: 'hall', name: 'Pavilhão', type: 'AREA', category: 'circulation', x: 25, y: 55, width: 1250, height: 545 },
    { id: 'case-1', name: 'Cases de Excelência Operacional', type: 'CASE_64M2', category: 'case', zone: 'Topo', x: 360, y: 95, width: 95, height: 62, area: 64 },
    { id: 'case-2', name: 'Cases de Excelência Operacional', type: 'CASE_64M2', category: 'case', zone: 'Topo', x: 585, y: 95, width: 95, height: 62, area: 64 },
    { id: 'entrada', name: 'Entrada Principal', type: 'ENTRADA', category: 'service', zone: 'Operacional Inferior', x: 540, y: 606, width: 55, height: 18 },
    { id: 'bwc-fem-1', name: 'BWC Fem.', type: 'BANHEIRO', category: 'service', zone: 'Operacional Inferior', x: 172, y: 582, width: 136, height: 28 },
    { id: 'bwc-masc-1', name: 'BWC Masc.', type: 'BANHEIRO', category: 'service', zone: 'Operacional Superior', x: 172, y: 55, width: 136, height: 80 },
    { id: 'chapelaria', name: 'Chapelaria', type: 'SERVICO', category: 'service', zone: 'Operacional Inferior', x: 332, y: 582, width: 42, height: 28 },
    { id: 'sala-palestrantes', name: 'Sala Palestrantes', type: 'SERVICO', category: 'service', zone: 'Operacional Inferior', x: 388, y: 582, width: 50, height: 28 },
    { id: 'apice', name: 'Ápice', type: 'APICE', category: 'service', zone: 'Operacional Inferior', x: 440, y: 582, width: 30, height: 28 },
  ],
  stands: [
    ...createAuditoriums(),
    ...createPremiumBlocks(),
    // Colunas de estandes do lado esquerdo (172 a 104) baseadas na planta real
    ...createCustomColumn({ idPrefix: 'ilha-a-1', startNumber: 172, x: 172, y: 165, rows: 11, colOffsetSign: 1, zone: 'Ilha A', palette: 'mini' }),
    ...createCustomColumn({ idPrefix: 'ilha-a-2', startNumber: 161, x: 252, y: 165, rows: 11, colOffsetSign: -1, zone: 'Ilha A', palette: 'mini' }),
    ...createCustomColumn({ idPrefix: 'ilha-a-3', startNumber: 150, x: 280, y: 165, rows: 11, colOffsetSign: 1, zone: 'Ilha A', palette: 'mini' }),
    ...createCustomColumn({ idPrefix: 'ilha-b-1', startNumber: 139, x: 332, y: 190, rows: 9, colOffsetSign: -1, zone: 'Ilha B', palette: 'standard' }),
    ...createCustomColumn({ idPrefix: 'ilha-b-2', startNumber: 130, x: 360, y: 190, rows: 9, colOffsetSign: 1, zone: 'Ilha B', palette: 'standard' }),
    ...createCustomColumn({ idPrefix: 'ilha-c-1', startNumber: 121, x: 412, y: 190, rows: 9, colOffsetSign: -1, zone: 'Ilha C', palette: 'standard' }),
    ...createCustomColumn({ idPrefix: 'ilha-c-2', startNumber: 112, x: 440, y: 190, rows: 9, colOffsetSign: 1, zone: 'Ilha C', palette: 'standard' }),
    
    // Colunas de estandes do lado direito (85 a 1) baseadas na planta real
    ...createRightColumn({ idPrefix: 'ilha-e-1', startNumber: 85, x: 760, y: 190, rows: 9, zone: 'Ilha E', palette: 'standard' }),
    ...createRightColumn({ idPrefix: 'ilha-e-2', startNumber: 76, x: 788, y: 190, rows: 9, zone: 'Ilha E', palette: 'standard' }),
    ...createRightColumn({ idPrefix: 'ilha-f-1', startNumber: 67, x: 840, y: 190, rows: 9, zone: 'Ilha F', palette: 'standard' }),
    ...createRightColumn({ idPrefix: 'ilha-f-2', startNumber: 58, x: 868, y: 190, rows: 9, zone: 'Ilha F', palette: 'standard' }),
    ...createRightColumn({ idPrefix: 'ilha-g-1', startNumber: 49, x: 920, y: 165, rows: 10, zone: 'Ilha G', palette: 'mini' }),
    ...createRightColumn({ idPrefix: 'ilha-g-2', startNumber: 39, x: 948, y: 165, rows: 10, zone: 'Ilha G', palette: 'mini' }),
    ...createRightColumn({ idPrefix: 'ilha-h-1', startNumber: 29, x: 1000, y: 165, rows: 10, zone: 'Ilha H', palette: 'standard' }),
    ...createRightColumn({ idPrefix: 'ilha-h-2', startNumber: 19, x: 1028, y: 165, rows: 10, zone: 'Ilha H', palette: 'standard' }),
    ...createRightColumn({ idPrefix: 'ilha-i-1', startNumber: 9, x: 1080, y: 195, rows: 9, zone: 'Ilha I', palette: 'standard' }),
  ],
};

export const getFloorObjects = (plan = expoIndustrialFloorPlan) => [...plan.zones, ...plan.stands];

export const getCommercialStands = (plan = expoIndustrialFloorPlan) =>
  plan.stands.filter((item) => item.category !== 'auditorium');
