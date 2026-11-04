import type { GeographicBounds, ProjectConfig, ProjectLayerConfig } from "./types";
import { templateProject } from "./template";

// Extensão obtida de bocaina/orto/orto.xml pelo script raster-from-xml,
// convertida de EPSG:900913 (metros) para graus [W, S, E, N].
// A pasta local confirmou o esquema TMS e os níveis 11–20.
// Esta extensão limita os tiles; não representa o limite da propriedade.
const orthomosaicBounds: GeographicBounds = [-45, -22.75592068, -44.82421875, -22.59372606];

export const orthomosaic: ProjectLayerConfig = {
  id: "ortomosaico",
  name: "Ortomosaico",
  description: "Ortomosaico da Fazenda do Fundão",
  kind: "orthomosaic",
  group: "raster",
  defaultVisible: true,
  legendMode: "none",
  source: {
    format: "tms",
    // TMS: os arquivos usam Y contado do sul; o provider usa {reverseY}.
    url: "https://pub-17801b8889694ba2a7b6688bcaa05ada.r2.dev/orto2/{z}/{x}/{reverseY}.png",
    credit: "Cardeal Map",
    bounds: orthomosaicBounds,
    minimumLevel: 11,
    maximumLevel: 20,
    tileWidth: 256,
    tileHeight: 256,
  },
};

// Vetores no padrão do projeto Ivan: GeoJSON em CRS84, sem Z, com id único
// (sem uniqueFeatureIds). Painel por panelOrder; desenho pelo zIndex, e o array
// de camadas segue a mesma ordem (a ordem entre GeoJSONs vem do array).
const r2 = "https://pub-17801b8889694ba2a7b6688bcaa05ada.r2.dev";
const geojson = (file: string) => `${r2}/geojson/${file}`;

// Área de estudo com a simulação 3D. O botão abre a simulação sobre o mapa sem
// mover a câmera (flyTo false) e, ao fechar, a câmera fica onde estava
// (onClose "keep"); a origem está liberada em embeddedPages. Ligada na abertura
// do desktop e desligada na do celular. Sem openOnHome: o popup só abre ao
// clicar ou tocar no polígono.
const simulationUrl = "https://suinocultura-3d.vercel.app/";
const areaEstudo: ProjectLayerConfig = {
  id: "area-estudo", name: "Área de Estudo", description: "Simulação 3D", kind: "vector", defaultVisible: true, defaultVisibleMobile: false, panelOrder: 1, opacityControl: true,
  source: {
    format: "geojson", url: geojson("area_estudo_simulacao.geojson"), autoZoom: false,
    style: { stroke: "#FF6A00", strokeWidth: 3, fill: "#FF6A00", fillOpacity: 0.18, clampToGround: true, zIndex: 25 },
    popup: {
      titleProperty: "nome",
      fields: [
        { property: "area_ha", label: "Área", decimals: 2, suffix: " ha" },
        { property: "perimetro_km", label: "Perímetro", decimals: 2, suffix: " km" },
      ],
      actions: [{ label: "Entrar na simulação 3D", url: simulationUrl, flyTo: false, onClose: "keep" }],
    },
  },
};

// Derivados do relevo: legenda desenhada no próprio raster, um por vez sobre o orto.
// Bounds = tiles inteiros do nível mínimo, não o contorno dos dados: só limitam
// as requisições, nunca a navegação.
const derived = (
  id: string, folder: string, name: string, kind: ProjectLayerConfig["kind"],
  minimumLevel: number, maximumLevel: number, bounds: GeographicBounds,
): ProjectLayerConfig => ({
  id, name, description: name, kind, defaultVisible: false,
  legendMode: "embedded", exclusiveGroup: "derivados",
  source: {
    format: "tms", url: `${r2}/${folder}/{z}/{x}/{reverseY}.png`, credit: "Cardeal Map",
    bounds, minimumLevel, maximumLevel, tileWidth: 256, tileHeight: 256,
  },
});
const derivedBounds: GeographicBounds = [-45.0000, -23.2413, -43.5937, -21.9430];
const mdsBounds: GeographicBounds = [-45.0000, -23.2413, -44.2969, -22.5937];

// Limite do imóvel no estilo das Matrículas do Ivan: só contorno amarelo.
const areaImovel: ProjectLayerConfig = {
  id: "area-imovel", name: "Área do Imóvel", description: "Área do Imóvel", kind: "property-boundary", defaultVisible: true, panelOrder: 2,
  source: {
    format: "geojson", url: geojson("area_imovel.geojson"), autoZoom: false,
    style: { stroke: "#FFD400", strokeWidth: 2.5, fillOpacity: 0, clampToGround: true, zIndex: 20 },
    popup: { titleProperty: "nome", fields: [
      { property: "area_ha", label: "Área", decimals: 2, suffix: " ha" },
      { property: "perimetro_km", label: "Perímetro", decimals: 2, suffix: " km" },
      { property: "matriculas", label: "Matrículas" },
    ] },
  },
};

// Só contorno branco, acima da área de estudo.
const piquetes: ProjectLayerConfig = {
  id: "piquetes", name: "Divisão de Piquetes", description: "Divisão de Piquetes", kind: "vector", defaultVisible: true, panelOrder: 3,
  source: {
    format: "geojson", url: geojson("divisao_piquetes.geojson"), autoZoom: false,
    style: { stroke: "#FFFFFF", strokeWidth: 1.5, fillOpacity: 0, clampToGround: true, zIndex: 26 },
    popup: { titleProperty: "nome", fields: [
      { property: "area_ha", label: "Área", decimals: 2, suffix: " ha" },
      { property: "perimetro_m", label: "Perímetro", format: "integer", suffix: " m" },
    ] },
  },
};

// Uma cor por microbacia pelo atributo "cor" (0 a 9): preenchimento e contorno iguais.
const microbaciaColors = ["#E6194B", "#3CB44B", "#FFE119", "#4363D8", "#F58231", "#911EB4", "#42D4F4", "#F032E6", "#BFEF45", "#FABED4"];
const microbacias: ProjectLayerConfig = {
  id: "microbacias", name: "Microbacias", description: "Microbacias", kind: "vector", defaultVisible: false, panelOrder: 4, opacityControl: true,
  source: {
    format: "geojson", url: geojson("microbacias_1.geojson"), autoZoom: false,
    style: {
      stroke: "#FFFFFF", strokeWidth: 1.5, fillOpacity: 0.35, clampToGround: true, zIndex: 3,
      // stroke na classe só serve de reserva do contorno se "cor" vier como texto ("3"):
      // o outline usa o índice numérico; a classificação aceita os dois.
      classification: { property: "cor", classes: Object.fromEntries(microbaciaColors.map((color, index) => [String(index), { fill: color, stroke: color }])) },
      outline: { property: "cor", colors: microbaciaColors, width: 1.5 },
    },
    popup: { titleProperty: "nome", fields: [
      { property: "area_ha", label: "Área", decimals: 2, suffix: " ha" },
      { property: "perimetro_km", label: "Perímetro", decimals: 2, suffix: " km" },
    ] },
  },
};

const curvas3: ProjectLayerConfig = {
  id: "curvas3", name: "Curvas de Nível (3 m)", description: "Curvas de Nível (3 m)", kind: "contours", defaultVisible: false, panelOrder: 5,
  source: {
    format: "geojson", url: geojson("curvas_3m_1.geojson"), autoZoom: false,
    style: { stroke: "#000000", strokeWidth: 1, clampToGround: true, zIndex: 5 },
    popup: { title: "Curva de nível", fields: [{ property: "cota_m", label: "Cota", suffix: " m", format: "integer" }] },
  },
};

// Ordem de Strahler por classificação simples. Este arquivo só tem ordens 1 a 3.
const drenagem: ProjectLayerConfig = {
  id: "drenagem", name: "Drenagem", description: "Drenagem", kind: "drainage", defaultVisible: false, panelOrder: 6,
  source: {
    format: "geojson", url: geojson("linhas_drenagem.geojson"), autoZoom: false,
    style: {
      stroke: "#00E5FF", strokeWidth: 1, clampToGround: true, zIndex: 10,
      classification: { property: "STRAHLER", classes: {
        1: { stroke: "#00E5FF", strokeWidth: 1, zIndex: 10 },
        2: { stroke: "#14B8F0", strokeWidth: 1.6, zIndex: 11 },
        3: { stroke: "#1E88E5", strokeWidth: 2.4, zIndex: 12 },
      } },
    },
    popup: { title: "Drenagem", fields: [
      { property: "STRAHLER", label: "Ordem de Strahler", format: "integer" },
      { property: "area_contribuicao_ha", label: "Área de contribuição", decimals: 2, suffix: " ha" },
    ] },
  },
};

// Configuração exclusiva da Fazenda do Fundão. Exemplos genéricos permanecem
// em template.ts, fora das camadas ativas. Roteiro: docs/NOVO-PROJETO.md.
export const project: ProjectConfig = {
  ...templateProject,
  id: "fazenda-fundao",
  name: "Fazenda do Fundão",
  location: "Localização a configurar",
  // Câmera definitiva capturada no Viewer, compartilhada pela abertura e Home.
  // Orientação em graus; projectCamera.ts faz a conversão para radianos.
  initialCamera: {
    longitude: -44.8602798,
    latitude: -22.7005254,
    height: 961.8,
    heading: 229.07,
    pitch: -32.03,
    roll: 0.00,
  },
  // Adicionar aqui as camadas configuradas, em ordem de empilhamento:
  // ortomosaico, MDT, MDS, declividade, orientação solar, curvas de nível,
  // drenagem, perímetro e demais GeoJSON, modelo 3D fotogramétrico.
  // URLs do R2, assetId, limites, níveis, legendas e popups dependem dos dados.
  // Camadas Macro devem usar source.macroPopup com os presets curados existentes.
  // Rasters e vetores são carregados mesmo invisíveis: não ativar placeholders.
  layers: [
    ...templateProject.layers,
    {
      id: "fundao-photogrammetry",
      name: "Modelo fotogramétrico 3D",
      description: "Modelo fotogramétrico da Fazenda do Fundão, carregado sob demanda do Cesium ion.",
      kind: "3d-tiles",
      group: "model",
      defaultVisible: false,
      // Preservar a transformação original; recortar somente o tileset.
      source: {
        format: "3d-tiles",
        source: "ion",
        assetId: 5838016,
        tokenEnv: "VITE_CESIUM_ION_TOKEN",
        terrainCutout: false,
        clipping: {
          enabled: true,
          // Manter o interior. ClippingPolygon fecha o último vértice no primeiro.
          inverse: true,
          positions: [
            [-44.8737242933728, -22.70369738342242],
            [-44.87445761116266, -22.70777213072152],
            [-44.870937157656655, -22.71150739633737],
            [-44.862149982544466, -22.711557205853197],
            [-44.85938684695207, -22.69696600912911],
            [-44.86491925267901, -22.695018261012276],
            [-44.87120045103885, -22.701589457769828],
          ],
        },
      },
    },
    orthomosaic,
    derived("mdt", "mdt", "Modelo Digital de Terreno", "dtm", 8, 17, derivedBounds),
    derived("mds", "mds", "Modelo Digital de Superfície", "dsm", 9, 18, mdsBounds),
    derived("declividade", "decli", "Declividade", "slope", 8, 17, derivedBounds),
    derived("aspecto", "aspect", "Orientação de Vertentes", "aspect", 8, 17, derivedBounds),
    microbacias,
    curvas3,
    drenagem,
    areaImovel,
    areaEstudo,
    piquetes,
  ],
  // Páginas que os popups podem abrir sobre o mapa (simulação 3D da área de estudo).
  embeddedPages: { allowedOrigins: [new URL(simulationUrl).origin] },
  panel: {
    showLayerSearch: false,
    sectionOrder: ["basemap", "model", "raster", "vector", "macro"],
    expandedSections: ["model"],
  },
  developmentTools: { modelAlignment: false, cropAuthoring: false, cropExportOnly: false, cameraCapture: false },
};
