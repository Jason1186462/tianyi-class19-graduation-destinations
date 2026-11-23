import { generatedCampusPresets } from "./campus-preset-catalog.js";

// Default coordinates were cross-checked against Baidu Maps POI data for the
// named principal undergraduate campus on 2026-11-23. The map tiles use the
// same Chinese map coordinate context, so school and campus markers stay aligned
// with visible roads and campus labels.
export const schoolLocations = {
  北京化工大学: {
    shortName: "北化",
    campus: "朝阳校区",
    address: "北京市朝阳区北三环东路15号",
    coordinates: [39.97101, 116.41824],
  },
  军事航天部队航天工程大学: {
    shortName: "航天工程",
    campus: "怀柔校区",
    address: "北京市怀柔区",
    coordinates: [40.3108, 116.644],
  },
  中国传媒大学: {
    shortName: "中传",
    campus: "定福庄校区",
    address: "北京市朝阳区定福庄东街1号",
    coordinates: [39.90965, 116.55618],
  },
  天津科技大学: {
    shortName: "天科大",
    campus: "河西校区",
    address: "天津市河西区大沽南路1038号",
    coordinates: [39.07251, 117.27239],
  },
  石家庄铁道大学: {
    shortName: "石铁大",
    campus: "北二环校区",
    address: "河北省石家庄市长安区北二环东路17号",
    coordinates: [38.0814, 114.50713],
  },
  中国石油大学: {
    shortName: "中石大",
    campus: "青岛校区",
    address: "山东省青岛市黄岛区长江西路66号",
    coordinates: [35.94164, 120.18259],
  },
  西安工程大学: {
    shortName: "西工程",
    campus: "金花校区",
    address: "陕西省西安市碑林区金花南路19号",
    coordinates: [34.25756, 108.99716],
  },
  西安电子科技大学: {
    shortName: "西电",
    campus: "南校区",
    address: "陕西省西安市长安区西沣路兴隆段266号",
    coordinates: [34.12223, 108.84028],
  },
  西南交通大学: {
    shortName: "西南交大",
    campus: "犀浦校区",
    address: "四川省成都市郫都区犀安路999号",
    coordinates: [30.76044, 103.99222],
  },
  武汉理工大学: {
    shortName: "武理工",
    campus: "马房山校区",
    address: "湖北省武汉市洪山区珞狮路122号",
    coordinates: [30.52213, 114.35182],
  },
  湖南师范大学: {
    shortName: "湖南师大",
    campus: "二里半校区",
    address: "湖南省长沙市岳麓区麓山路36号",
    coordinates: [28.18305, 112.95398],
  },
  南昌大学: {
    shortName: "昌大",
    campus: "前湖校区",
    address: "江西省南昌市红谷滩区学府大道999号",
    coordinates: [28.66514, 115.81231],
  },
  中央民族大学: {
    shortName: "民大",
    campus: "海南校区",
    address: "海南省陵水黎族自治县黎安国际教育创新试验区",
    coordinates: [18.40139, 110.02242],
  },
  合肥工业大学: {
    shortName: "合工大",
    campus: "翡翠湖校区",
    address: "安徽省合肥市蜀山区丹霞路485号",
    coordinates: [31.77494, 117.20511],
  },
  宁波工程学院: {
    shortName: "宁工程",
    campus: "风华校区",
    address: "浙江省宁波市江北区风华路201号",
    coordinates: [29.90988, 121.61418],
  },
  徐州医科大学: {
    shortName: "徐医大",
    campus: "主校区",
    address: "江苏省徐州市云龙区铜山路209号",
    coordinates: [34.26039, 117.26083],
  },
  南京信息工程大学: {
    shortName: "南信大",
    campus: "主校区",
    address: "江苏省南京市浦口区宁六路219号",
    coordinates: [32.20683, 118.72035],
  },
  南京审计大学: {
    shortName: "南审",
    campus: "浦口校区",
    address: "江苏省南京市浦口区雨山西路86号",
    coordinates: [32.0596, 118.61254],
  },
  南京邮电大学: {
    shortName: "南邮",
    campus: "仙林校区",
    address: "江苏省南京市栖霞区文苑路9号",
    coordinates: [32.1191, 118.92746],
  },
  扬州大学: {
    shortName: "扬大",
    campus: "荷花池校区",
    address: "江苏省扬州市邗江区大学南路88号",
    coordinates: [32.38024, 119.42071],
  },
  南京林业大学: {
    shortName: "南林",
    campus: "新庄校区",
    address: "江苏省南京市玄武区龙蟠路159号",
    coordinates: [32.07645, 118.81057],
  },
  南通大学: {
    shortName: "通大",
    campus: "啬园校区",
    address: "江苏省南通市崇川区啬园路9号",
    coordinates: [31.97085, 120.91114],
  },
  南京大学: {
    shortName: "南大",
    campus: "仙林校区",
    address: "江苏省南京市栖霞区仙林大道163号",
    coordinates: [32.11393, 118.96432],
  },
  苏州大学: {
    shortName: "苏大",
    campus: "天赐庄校区",
    address: "江苏省苏州市姑苏区十梓街1号",
    coordinates: [31.30524, 120.63922],
  },
  常州大学: {
    shortName: "常大",
    campus: "武进校区",
    address: "江苏省常州市武进区滆湖中路21号",
    coordinates: [31.68769, 119.95586],
  },
  南京中医药大学: {
    shortName: "南中医",
    campus: "仙林校区",
    address: "江苏省南京市栖霞区仙林大道138号",
    coordinates: [32.10461, 118.95102],
  },
  南京工程学院: {
    shortName: "南工程",
    campus: "江宁校区",
    address: "江苏省南京市江宁区弘景大道1号",
    coordinates: [31.91902, 118.87715],
  },
  南京农业大学: {
    shortName: "南农",
    campus: "卫岗校区",
    address: "江苏省南京市玄武区童卫路6号",
    coordinates: [32.03346, 118.84174],
  },
  江苏大学: {
    shortName: "江大",
    campus: "本部",
    address: "江苏省镇江市京口区学府路301号",
    coordinates: [32.19524, 119.51097],
  },
  中国矿业大学: {
    shortName: "矿大",
    campus: "南湖校区",
    address: "江苏省徐州市铜山区大学路1号",
    coordinates: [34.20752, 117.13995],
  },
  南京师范大学: {
    shortName: "南师",
    campus: "仙林校区",
    address: "江苏省南京市栖霞区文苑路1号",
    coordinates: [32.1131, 118.91695],
  },
  西交利物浦大学: {
    shortName: "西浦",
    campus: "工业园区校区",
    address: "江苏省苏州市工业园区仁爱路111号",
    coordinates: [31.27173, 120.73929],
  },
  江南大学: {
    shortName: "江南",
    campus: "蠡湖校区",
    address: "江苏省无锡市滨湖区蠡湖大道1800号",
    coordinates: [31.48231, 120.27707],
  },
  江苏科技大学: {
    shortName: "江科大",
    campus: "梦溪校区",
    address: "江苏省镇江市京口区梦溪路2号",
    coordinates: [32.19772, 119.46584],
  },
};

const yangzhouUniversityCampusPresets = [
  {
      campus: "荷花池校区",
      aliases: ["扬州大学荷花池校区", "荷花池"],
      address: "江苏省扬州市邗江区大学南路88号",
      coordinates: [32.38024, 119.42071],
      city: "扬州",
      province: "江苏",
  },
  {
      campus: "扬子津校区",
      aliases: ["扬州大学扬子津校区", "扬子津", "扬子津西校区"],
      address: "江苏省扬州市邗江区华扬西路196号",
      coordinates: [32.34439, 119.40565],
      city: "扬州",
      province: "江苏",
  },
  {
      campus: "瘦西湖校区",
      aliases: ["扬州大学瘦西湖校区", "瘦西湖"],
      address: "江苏省扬州市邗江区四望亭路180号",
      coordinates: [32.39768, 119.42407],
      city: "扬州",
      province: "江苏",
  },
  {
      campus: "文汇路校区",
      aliases: ["扬州大学文汇路校区", "文汇路"],
      address: "江苏省扬州市邗江区文昌中路567号",
      coordinates: [32.3857, 119.4243],
      city: "扬州",
      province: "江苏",
  },
  {
      campus: "江阳路南校区",
      aliases: ["扬州大学江阳路南校区", "江阳路南"],
      address: "江苏省扬州市邗江区江阳中路131号",
      coordinates: [32.37684, 119.42502],
      city: "扬州",
      province: "江苏",
  },
  {
      campus: "江阳路北校区",
      aliases: ["扬州大学江阳路北校区", "江阳路北"],
      address: "江苏省扬州市邗江区江阳中路136号",
      coordinates: [32.37612, 119.42208],
      city: "扬州",
      province: "江苏",
  },
];

const nanjingChineseMedicineCampusPresets = [
  {
    campus: "汉中门校区",
    aliases: ["南京中医药大学汉中门校区", "汉中门"],
    address: "江苏省南京市鼓楼区汉中路282号",
    coordinates: [32.04319, 118.7669],
    city: "南京",
    province: "江苏",
  },
  {
    campus: "泰州校区",
    aliases: ["南京中医药大学泰州校区", "泰州校区", "泰州"],
    address: "江苏省泰州市海陵区匡时路6号",
    coordinates: [32.38069, 119.89288],
    city: "泰州",
    province: "江苏",
  },
];

const manuallyVerifiedCampusPresets = {
  扬州大学: yangzhouUniversityCampusPresets,
  南京中医药大学: nanjingChineseMedicineCampusPresets,
  南京大学: [
    {
      campus: "鼓楼校区",
      aliases: ["南京大学鼓楼校区", "鼓楼"],
      address: "江苏省南京市鼓楼区汉口路22号",
      coordinates: [32.05384, 118.7806],
      city: "南京",
      province: "江苏",
    },
  ],
  南京邮电大学: [
    {
      campus: "三牌楼校区",
      aliases: ["南京邮电大学三牌楼校区", "三牌楼"],
      address: "江苏省南京市鼓楼区新模范马路66号",
      coordinates: [32.08153, 118.77259],
      city: "南京",
      province: "江苏",
    },
  ],
  南京审计大学: [
    {
      campus: "莫愁校区",
      aliases: ["南京审计大学莫愁校区", "国际校区", "莫愁"],
      address: "江苏省南京市鼓楼区北圩路77号",
      coordinates: [32.03922, 118.75391],
      city: "南京",
      province: "江苏",
    },
  ],
  中央民族大学: [
    {
      campus: "海淀校区",
      aliases: ["中央民族大学海淀校区", "海淀"],
      address: "北京市海淀区中关村南大街27号",
      coordinates: [39.95162, 116.31712],
      city: "北京",
      province: "北京",
    },
    {
      campus: "丰台校区",
      aliases: ["中央民族大学丰台校区", "丰台", "王佐校区"],
      address: "北京市丰台区魏各庄路27号",
      coordinates: [39.81588, 116.11757],
      city: "北京",
      province: "北京",
    },
  ],
  中国石油大学: [
    {
      campus: "古镇口校区",
      aliases: ["中国石油大学古镇口校区", "古镇口"],
      address: "山东省青岛市黄岛区海军路6号",
      coordinates: [35.77082, 120.03215],
      city: "青岛",
      province: "山东",
    },
  ],
  南京师范大学: [
    {
      campus: "紫金校区",
      aliases: ["南京师范大学紫金校区", "紫金"],
      address: "江苏省南京市玄武区板仓街92-1号",
      coordinates: [32.07254, 118.82284],
      city: "南京",
      province: "江苏",
    },
  ],
  中国矿业大学: [
    {
      campus: "文昌校区",
      aliases: ["中国矿业大学文昌校区", "文昌"],
      address: "江苏省徐州市泉山区金山东路1号",
      coordinates: [34.22263, 117.19868],
      city: "徐州",
      province: "江苏",
    },
  ],
  宁波工程学院: [
    {
      campus: "前湾校区",
      aliases: ["宁波工程学院前湾校区", "杭州湾校区", "前湾"],
      address: "浙江省宁波市慈溪市杭州湾新区滨海二路769号",
      coordinates: [30.32422, 121.24524],
      city: "宁波",
      province: "浙江",
    },
  ],
  常州大学: [
    {
      campus: "西太湖校区",
      aliases: ["常州大学西太湖校区", "西太湖"],
      address: "江苏省常州市武进区丰泽路与稻香路交叉口",
      coordinates: [31.71152, 119.82923],
      city: "常州",
      province: "江苏",
    },
  ],
  江苏大学: [
    {
      campus: "梦溪校区",
      aliases: ["江苏大学梦溪校区", "梦溪"],
      address: "江苏省镇江市京口区梦溪园巷30号",
      coordinates: [32.20282, 119.46195],
      city: "镇江",
      province: "江苏",
    },
  ],
};

export const campusPresets = Object.fromEntries(
  Object.entries(generatedCampusPresets).map(([school, presets]) => [
    school,
    [...(manuallyVerifiedCampusPresets[school] ?? []), ...presets],
  ]),
);

function normalizeCampusName(value, school = "") {
  let normalized = String(value ?? "");
  if (school) normalized = normalized.split(school).join("");
  return normalized
    .replace(/江苏(?:省)?扬州市?/g, "")
    .replace(/扬州大学/g, "")
    .replace(/(?:本人确认|已确认|实际报到|实际校区)/g, "")
    .replace(/校区/g, "")
    .replace(/[\s()（）·,，-]/g, "")
    .toLowerCase();
}

export function getCampusPresets(school) {
  const seen = new Set();
  const result = [];
  for (const preset of campusPresets[school] ?? []) {
    const keys = [preset.campus, ...(preset.aliases ?? [])]
      .map((name) => normalizeCampusName(name, school))
      .filter(Boolean);
    if (!keys.length || keys.some((key) => seen.has(key))) continue;
    keys.forEach((key) => seen.add(key));
    result.push(preset);
  }
  return result;
}

export function findCampusPreset(school, campusName) {
  const candidate = normalizeCampusName(campusName, school);
  if (!candidate) return null;
  return (
    getCampusPresets(school).find((preset) =>
      [preset.campus, ...(preset.aliases ?? [])].some((name) => {
        const normalizedName = normalizeCampusName(name, school);
        return normalizedName && candidate.startsWith(normalizedName);
      }),
    ) ?? null
  );
}

export function getSchoolLocation(school) {
  return schoolLocations[school] ?? null;
}
