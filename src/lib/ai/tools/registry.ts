import type { ToolDefinition, ToolParam, FunctionCallTool } from "../types";
import type { ToolContext } from "../types";

import { handleSearchHospitals, handleGetHospitalDetail } from "./handlers/hospital";
import { handleSearchDepartments, handleRecommendDepartment } from "./handlers/department";
import { handleSearchDoctors, handleGetDoctorDetail } from "./handlers/doctor";
import { handleGetDoctorSchedules } from "./handlers/schedule";
import {
  handleCreateRegistration,
  handleListRegistrations,
  handleCancelRegistration,
} from "./handlers/registration";
import { handleGetPatientProfiles, handleCreatePatientProfile } from "./handlers/profile";
import { handleGetRegistrationGuide, handleAnalyzeImage } from "./handlers/guide";

/* ── param shorthand ── */

function str(desc: string, required = false, enums?: string[]): ToolParam {
  return {
    type: "string",
    description: desc,
    ...(required ? { required: true } : {}),
    ...(enums ? { enum: enums } : {}),
  };
}

/* ── Tool Definitions ── */

const toolDefs: ToolDefinition[] = [
  {
    name: "search_hospitals",
    description: "搜索医院，可按城市、等级、关键字筛选",
    parameters: {
      keyword: str("搜索关键字（医院名称）"),
      city: str("城市名（如「北京」「上海」），不传则全国搜索"),
      level: str("医院等级（如「三级甲等」「二级甲等」）"),
    },
    handler: handleSearchHospitals,
  },
  {
    name: "search_departments",
    description: "查询指定医院下的所有科室",
    parameters: {
      hospitalId: str("医院ID", true),
    },
    handler: handleSearchDepartments,
  },
  {
    name: "search_doctors",
    description: "查询指定科室下的所有医生",
    parameters: {
      departmentId: str("科室ID", true),
    },
    handler: handleSearchDoctors,
  },
  {
    name: "get_doctor_schedules",
    description: "查看指定医生未来7天的排班信息",
    parameters: {
      doctorId: str("医生ID", true),
    },
    handler: handleGetDoctorSchedules,
  },
  {
    name: "get_patient_profiles",
    description: "获取当前用户的所有就诊人信息（需要登录）",
    parameters: {},
    handler: handleGetPatientProfiles,
  },
  {
    name: "create_patient_profile",
    description: "添加新的就诊人",
    parameters: {
      name: str("就诊人姓名", true),
      idCard: str("身份证号", true),
      phone: str("手机号", true),
      gender: str("性别", true, ["male", "female"]),
    },
    handler: handleCreatePatientProfile,
  },
  {
    name: "create_registration",
    description: "创建挂号（预约）记录",
    parameters: {
      scheduleId: str("排班ID", true),
      profileId: str("就诊人ID", true),
      type: str("号类类型", true, ["normal", "expert", "special"]),
    },
    handler: handleCreateRegistration,
  },
  {
    name: "list_registrations",
    description: "查看我的挂号记录，可按状态筛选",
    parameters: {
      status: str("挂号状态筛选", false, ["pending", "done", "cancelled"]),
    },
    handler: handleListRegistrations,
  },
  {
    name: "cancel_registration",
    description: "取消挂号（仅可取消待就诊状态的挂号）",
    parameters: {
      registrationId: str("挂号记录ID", true),
    },
    handler: handleCancelRegistration,
  },
  {
    name: "get_hospital_detail",
    description: "查看医院详细信息",
    parameters: {
      hospitalId: str("医院ID", true),
    },
    handler: handleGetHospitalDetail,
  },
  {
    name: "get_doctor_detail",
    description: "查看医生详细信息",
    parameters: {
      doctorId: str("医生ID", true),
    },
    handler: handleGetDoctorDetail,
  },
  {
    name: "recommend_department",
    description: "根据患者的症状描述推荐合适的就诊科室",
    parameters: {
      symptoms: str("症状描述，如「发烧咳嗽」「头痛三天」", true),
    },
    handler: handleRecommendDepartment,
  },
  {
    name: "get_registration_guide",
    description: "获取就诊前的准备事项、所需证件和注意事项",
    parameters: {
      hospitalId: str("医院ID（可选），指定后返回该医院的具体就诊须知"),
    },
    handler: handleGetRegistrationGuide,
  },
  {
    name: "analyze_image",
    description: "分析用户上传的图片（如化验单、检查报告、CT片等），从中提取关键信息并给出解读",
    parameters: {
      imageUrl: str("图片的URL或base64数据", true),
      imageType: str("图片类型，如 lab_report（化验单）、exam_report（检查报告）、ct_scan（CT片）、prescription（处方）、other（其他）"),
    },
    handler: handleAnalyzeImage,
  },
];

export default toolDefs;

/**
 * Convert internal tool definitions to OpenAI/DeepSeek function calling format.
 */
export function toolsToFunctionCalling(): FunctionCallTool[] {
  return toolDefs.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: {
        type: "object" as const,
        properties: Object.fromEntries(
          Object.entries(t.parameters).map(([key, param]) => [
            key,
            {
              type: param.type,
              description: param.description,
              ...(param.enum ? { enum: param.enum } : {}),
            },
          ])
        ),
        required: Object.entries(t.parameters)
          .filter(([, v]) => v.required)
          .map(([k]) => k),
      },
    },
  }));
}

export { toolDefs as tools };
