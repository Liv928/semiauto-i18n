<template>
  <div class="interview-info">
    <div class="interview-info-title">面试记录</div>
    <div v-loading="loading" class="interview-info-content">
      <div v-if="dataList.length>0">
        <div v-for="(item, i) in dataList" :key="i" class="interview-info-item">
          <div class="step-line">
            <div class="step-line-circle">
              <div class="step-line-circle-inner" />
            </div>
            <div class="y-line" />
            <div v-if="i == 4" class="step-line-circle">
              <div class="step-line-circle-inner" />
            </div>
          </div>
          <div class="step-content">
            <div class="step-content-top">
              <div class="top-left">
                <div class="step-date">{{ formatTime(getInterviewTime(item.interviewDate)) }}</div>
                <div class="step-time">{{ m_codeToName(item.interviewType, 'INTERVIEW_TYPE') }}</div>
                <div class="step-way">{{ m_codeToName(item.interviewForm, 'INTERVIEW_FORM') }}</div>
              </div>
              <div v-show="item.selectResType!=='30'" class="top-right" style="margin-right: 20px">
                <div v-showBtn="'HRecruitingBTN_1_4_8_1_10'" class="btn" @click="editInterview(4, item)">查看</div>
                <div v-show="enableEdit && item.status!=='90' && item.status!=='91' && item.status!=='30'" v-showBtn="'HRecruitingBTN_1_4_8_1_11'" class="btn" @click="editInterview(item.interviewClass==='1'?2:3, item)">变更面试</div>
                <div v-show="enableEdit && item.status!=='30' && item.status!=='90'" v-showBtn="'HRecruitingBTN_1_4_8_1_12'" class="btn" @click="deleteRecords(item.guid)">删除</div>
              </div>
            </div>
            <div class="step-content-bottom">
              <div class="bottom-info">
                <div class="info-block" style="width: 70px">
                  <strong style="font-size: large;">{{ getLineName(item.lineCode) }}</strong>
                </div>
                <div class="info-block" style="width: 150px">
                  <div style="margin-bottom: 10px">安排人：{{ item.createUserName }}</div>
                  <div>安排时间：{{ formatDate(item.createTime) }}</div>
                </div>
                <div class="info-block" style="width: 140px">
                  <div style="margin-bottom: 10px">面试状态：{{ m_codeToName(item.status, 'INTERVIEW_STATUS') }}</div>
                  <div v-if="item.selectResType==='30'">候选人{{ m_codeToName(item.selectResType, 'SELECT_RES_TYPE') }}</div>
                  <div v-else>候选人{{ m_codeToName(item.signStatus, 'SIGN_STATUS') }}</div>
                </div>
                <div class="info-block">
                  反馈状态：{{ formatInterviewResult(item.interviewResult) }}
                </div>
              </div>
              <div v-show="item.selectResType!=='30' && enableEdit" class="bottom-do">
                <div v-show="compareCurrentTimeWithDateString(item.interviewDate)===0&&(item.status==='20' || item.status==='40')" v-showBtn="'HRecruitingBTN_1_4_8_1_13'" class="btn" style="color: #E42F4F ;" @click="cancelInterview(item.guid)">取消面试</div>
                <div v-show="compareCurrentTimeWithDateString(item.interviewDate)===1&&item.status==='20'" v-showBtn="'HRecruitingBTN_1_4_8_1_14'" class="btn" @click="statusChange(item)">未参加</div>
                <div v-show="item.status==='20'" v-showBtn="'HRecruitingBTN_1_4_8_1_15'" class="btn" @click="prompt(item.guid)">催促</div>
                <div v-show="item.status==='30'" v-showBtn="'HRecruitingBTN_1_4_8_1_16'" class="btn" @click="editFeedback({tl: '查看', editFlag:false, operation: 1}, item)">查看反馈</div>
                <div v-show="item.status==='30'" v-showBtn="'HRecruitingBTN_1_4_8_1_17'" class="btn" @click="editFeedback({tl: '修改', editFlag:true, operation: 2}, item)">修改反馈</div>
                <div v-show="item.status==='20'" v-showBtn="'HRecruitingBTN_1_4_8_1_18'" class="btn" @click="editFeedback({tl: '替他', editFlag:true, operation: 3}, item)">替他反馈</div>
                <!-- <div class="btn" @click="arrangeInterviewer(item)">安排面试官</div> -->
                <div v-show="item.status==='40'&&item.interviewClass==='2'" v-showBtn="'HRecruitingBTN_1_4_8_1_19'" class="btn" @click="arrangeInterviewer(item)">安排面试官</div>
              </div>
              <img
                v-if="item.selectResType==='30'"
                src="@/assets/applicant/refuse_interview.png"
                class="refuse-icon"
              >
            </div>
            <div v-if="item.selectResType==='30'" class="more-info">
              <div class="more-info-top">
                <span>候选人姓名：{{ applicant.empName }}</span>
                <span style="margin-left: 20px;">拒绝时间：{{ formatDate(item.selectTime) }}</span>
              </div>
              <div class="more-info-bottom">
                <span>拒绝原因：{{ item.giveUpReasonName }}</span>
                <!-- {{ m_codeToName(item.selectResType, 'SELECT_RES_TYPE') }} -->
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <img src="@/assets/404/empty-data.png" class="empty-img">
      </div>

    </div>
  </div>
</template>
<script>
import * as applicantDetailQuery from '@/api/applicantDetail/index.js'
import * as applicantQuery from '@/api/applicant/index.js'
import { LocalStorage } from '@/utils/storage'
export default {
  name: 'InterviewInfo',
  props: {
    enableEdit: {
      type: Boolean,
      default: true
    },
    deliveryId: {
      type: String,
      default() {
        return ''
      }
    },
    applicant: {
      type: Object,
      default() {
        return {}
      }
    }
  },
  data() {
    return {
      permissions: localStorage.getItem('permissionResourceCode'),
      loading: false,
      dataList: [],
      lineCodeList: [],
      statusMap: {}
      // rawDataList: []
    }
  },
  computed: {
    codeList() {
      return LocalStorage.parentGet('codeList')
    }
  },
  watch: {
    deliveryId(newVal, oldVal) {
      this.update()
    }
  },
  created() {
    console.log('面试记录 delivery-id', this.deliveryId)
    console.log('面试记录 enableEdit', this.enableEdit)
  },
  mounted() {
    this.queryInterviewRecords()
    this.queryInterviewLine()
    this.queryInterviewStatus()
  },
  updated() {

  },
  methods: {
    queryInterviewRecords() {
      this.loading = true
      const param = {
        deliveryId: this.deliveryId
      }
      this.$http
        .post(applicantDetailQuery.queryInterviewRecords, param)
        .then((res) => {
          // this.rawDataList = JSON.parse(JSON.stringify(res.data))
          this.dataList = res.data
          console.log('datalist ', this.dataList)
          this.loading = false
        })
    },
    queryInterviewLine() {
      const param = {
        currentPage: -1,
        pageSize: -1,
        object: { status: '1' }
      }
      this.$http
        .post(applicantQuery.queryInterviewLine, param)
        .then((res) => {
          this.lineCodeList = res.data.records
        })
    },
    queryInterviewStatus() {
      const data = this.codeList.filter(x => x.codesetCode === 'INTERVIEW_STATUS')
      data.forEach(item => {
        this.statusMap[item.itemCode] = item.itemChsCode
      })
    },
    update() {
      this.loading = true
      console.log('update records here')
      this.queryInterviewRecords()
      this.queryInterviewLine()
      this.queryInterviewStatus()
      this.loading = false
    },
    cancelInterview(guid) {
      this.$bxDialog(
        '取消面试',
        () => import('@/views/cd/candidate/src/dialogs/cancelInterviewDialog.vue'),
        {
          data: {
            width: '850px'
          },
          param: { guid: guid }
        },
        (res) => {
          if (res === '1') {
            this.queryInterviewRecords()
          }
        }
      )
    },
    deleteRecords(guid) {
      this.$confirm('确定删除该条面试记录吗', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const param = {
          guid: guid
        }
        this.$http
          .post(applicantDetailQuery.deleteInterview, param)
          .then((res) => {
            this.$message({
              type: 'success',
              message: '已删除该条面试记录'
            })
            this.queryInterviewRecords()
          })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    prompt(guid) {
      this.$confirm('未到面试时间，是否确认催促?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const param = {
          deliveryId: this.deliveryId,
          guid: guid
        }
        this.$bxDialog(
          '催促',
          () => import('@/views/cd/candidate/src/dialogs/promptDialog.vue'),
          {
            data: {
              width: '850px'
            },
            param: { param: param }
          },
          () => {

          }
        )
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消催促'
        })
      })
    },
    // 2-查看/编辑面试，3-变更面试
    editInterview(operation, item) {
      this.$emit('drawerShow', { op: operation, interviewDetail: item })
    },
    editFeedback(obj, item) {
      console.log('obj operation', obj.operation)
      this.$bxDialog(
        obj.tl + '反馈',
        () => import('@/views/cd/candidate/src/dialogs/itvFeedbackDialog.vue'),
        {
          data: {
            width: '750px'
          },
          param: { interviewInfo: item, deliveryId: this.deliveryId, editable: obj.editFlag, operation: obj.operation }

        },
        (res) => {
          if (res === '1') {
            this.queryInterviewRecords()
          }
        }
      )
    },
    // 安排面试官
    arrangeInterviewer(item) {
      if (item.interviewDate.length <= 0) {
        this.$message({
          message: '该候选人还未选择面试时间',
          type: 'warning'
        })
      }
      this.$bxDialog(
        '通知面试官',
        () => import('@/views/cd/candidate/src/dialogs/arrangeInterviewerDialog.vue'),
        {
          data: {
            width: '850px'
          },
          param: { interviewInfo: item, deliveryId: this.deliveryId }

        },
        () => {

        }
      )
    },
    getLineName(code) {
      // console.log('get line name', this.lineCodeList.find(item => item.lineCode === 'MADMINFoix'))
      const name = this.lineCodeList.find(item => item.lineCode === code)?.lineName
      return name
    },
    formatDate(val) {
      const year = val.slice(0, 4)
      const month = val.slice(4, 6)
      const day = val.slice(6, 8)

      return `${year}-${month}-${day}`
    },
    formatTime(val) {
      if (val) {
        return val.slice(0, -3)
      } else {
        return val
      }
    },
    formatInterviewResult(val) {
      if (val === '1') {
        return '合格'
      } else if (val === '0') {
        return '不合格'
      } else {
        return '-'
      }
    },
    compareCurrentTimeWithDateString(dateString) {
      const itvTime = this.getInterviewTime(dateString)
      const year = parseInt(itvTime.substring(0, 4), 10)
      const month = parseInt(itvTime.substring(5, 7), 10) - 1// 月份从0开始
      const day = parseInt(itvTime.substring(8, 10), 10)
      const hour = parseInt(itvTime.substring(11, 13), 10)
      const minute = parseInt(itvTime.substring(14, 16), 10)

      const interviewTime = new Date(year, month, day, hour, minute)

      // 获取当前日期时间
      const now = new Date()

      // 比较两个日期时间
      if (interviewTime <= now) {
        // console.log('已到面试时间')
        return 1 // 已到面试时间
      } else {
        // console.log('未到面试时间')
        return 0 // 未到面试时间
      }
    },
    statusChange(item) {
      this.$confirm('是否确定将该候选人面试状态变为未参加?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const param = {
          guid: item.guid,
          status: '91'
        }
        this.$http
          .post(applicantDetailQuery.updateInterviewStatus, param)
          .then((res) => {
            this.$message({
              message: '已成功将候选人面试状态更新为未参加',
              type: 'success'
            })
            this.queryInterviewRecords()
          })
      }).catch(() => {
      })
    },
    getInterviewTime(val) {
      if (val) {
        return val.split(',')[0]
      } else {
        return ''
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.empty-img {
    max-width: 25%;
    max-height: 25%;
    display: block; /* 可选，用于去除图片底部的空白间隙 */
    margin: auto;
  }
.interview-info {
  display: flex;
  flex-direction: column;

  .interview-info-title {
    font-size: 14px;
    font-weight: 600;
    color: #333333;
  }

  .interview-info-content {
    padding: 20px 0;

    .interview-info-item {
      display: flex;
      flex-direction: row;
      gap: 20px;
      margin-top:12px;

      .step-line {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        .step-line-circle {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background-color: #016AFE;
          border-radius: 50%;
          text-align: center;

          .step-line-circle-inner {
            width: 10px;
            height: 10px;
            background-color: #fff;
            border-radius: 50%;
          }
        }

        .y-line {
          height: 90px;
          width: 1px;
          background-color: #EBEDF0;
        }
      }

      .step-content {
        display: flex;
        flex-direction: column;
        // gap: 10px;
        padding: 2px;
        flex: 1;

        .step-content-top {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          color: #404040;
          font-weight: 500;
          gap: 10px;
          margin-bottom: 6px;

          .top-left {
            display: flex;
            flex-direction: row;
            gap: 10px;
          }

          .top-right {
            display: flex;
            flex-direction: row;
            gap: 10px;
          }
        }
        .btn {
            cursor: pointer;
            color: #016AFE;
            user-select: none;
          }
        .step-content-bottom {
          position: relative;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          background-color: #F7F8FA;
          color: #404040;
          font-weight: 500;
          padding: 20px;
          .bottom-info {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 20px;

          }
          .bottom-do {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
          }
          .refuse-icon {
            position: absolute;
            right: 10px;
            bottom: -12px;
          }
        }
        .more-info {
          padding: 20px;
          border-left: 1px solid #EBEDF0;
          border-right: 1px solid #EBEDF0;
          border-top: none;
          border-bottom: 1px solid #EBEDF0;

          display: flex;
          flex-direction: column;
          justify-content: center;
        }
      }
    }
  }
}
</style>
