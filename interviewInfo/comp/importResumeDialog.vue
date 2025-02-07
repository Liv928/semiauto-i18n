<template>
  <div class="import-resume">
    <div class="header">
      <div class="item">
        <div class="circle" :class="{active:true}">1</div>
        <span class="process-text">{{ $t('RT.dao-ru-hou-xuan-ren-jian-li') }}</span>
      </div>
      <div class="item">
        <div class="line" />
      </div>
      <div class="item">
        <div class="circle" :class="{active:importSteps==='2'}">2</div>
        <span class="process-text">{{ $t('RT.jian-li-jie-xi-yu-lan') }}</span>
      </div>
    </div>
    <div class="divider" style="margin-bottom: 14px;" />
    <div v-if="importSteps=='1'" class="step-one">
      <bx-filter
        ref="filter_one"
        :config="uploadConfig"
        :all-edit="true"
        :row="24"
        :show-slide="false"
        label-width="100px"
      >
        <div slot="upload">
          <div v-loading="loading" class="upload-container">
            <el-upload
              class="upload-demo"
              accept=".pdf,.doc,.docx"
              action="https://jsonplaceholder.typicode.com/posts/"
              :auto-upload="true"
              :http-request="requestUpload"
              :show-file-list="true"
              :file-list="fileList"
              :limit="3"
              :on-exceed="onExceed"
              drag
              multiple
            >
              <i style="color: #2B78FF;" class="el-icon-upload" />
              <div class="el-upload__text"><em>{{ $t('RT.dian-ji-shang-chuan-duo-fen-jian-li') }}</em></div>
              <div class="el-upload__text upload-prompt">{{ $t('RT.（-ke-shang-chuan-duo-fen-jian-li-，-zhi-chi')pdf、doc、docx$t('RT.ge-shi-，-da-xiao-bu-chao-guo')10M$t('RT.）') }}</div>
            </el-upload>
          </div>
        </div>
      </bx-filter>
      <div class="text">{{ $t('RT.mei-you-jian-li-huo-jian-li-jie-xi-bu-cheng-gong-？-zhi-xu-lu-ru-jian-dan-de-xin-xi-jiu-ke-yi-tian-jia-hou-xuan-ren') }}</div>
      <div class="text"> <span class="click" @click="addApplicant">{{ $t('RT.shou-dong-tian-jia-hou-xuan-ren') }}</span></div>
    </div>
    <div v-if="importSteps=='2'" class="step-two">
      <div class="top">
        <div v-for="(item, idx) in fileList" :key="idx">
          <div class="top-item" :class="{activeFile: idx === resumeDataIndex}" @click="resumeDataSelect(idx)">
            <img v-if="item.type=='pdf'" src="@/assets/applicant/upload_pdf.png">
            <img v-else src="@/assets/applicant/upload_word.png">
            <div class="file">
              <el-tooltip class="item" effect="dark" :content="item.name" placement="bottom">
                <div><div class="file-name">{{ item.name }}</div></div>
              </el-tooltip>
            </div>

          </div>
        </div>
      </div>

      <div v-loading="(contentLoading && formLoading)" class="content">

        <div class="content-left">
          <div class="content-container">
            <div class="content-tabs">
              <div class="c-tab" :class="{activetab:activeTab==='1'}" @click="tabChange">
                {{ $t('RT.yuan-shi-jian-li') }}
              </div>
              <div class="c-tab" :class="{activetab:activeTab==='2'}" @click="tabChange">
                {{ $t('RT.biao-zhun-jian-li') }}
              </div>
            </div>
            <div v-show="activeTab==='2'">
              <div v-for="item in dynamicForm" :key="item.groupNameEn">
                <div v-if="item.fieldSelfList.length>0 && item.groupNameEn" class="content-container">
                  <div class="content-tl" style="margin-left: 10px;">
                    <div class="title">
                      <span class="vertical-line" />
                      <span class="title-text">{{ item.groupName }}</span>
                    </div>
                  </div>
                  <bx-filter
                    :ref="item.groupNameEn"
                    :config="groupData[item.groupNameEn]"
                    :all-edit="true"
                    :row="12"
                    :show-slide="false"
                    label-width="140px"
                  />
                </div>
              </div>

            </div>
            <div v-show="activeTab==='1'">
              <div class="preview">
                <iframe
                  id="previewFrame"
                  style="height: 390px;width:100%"
                  title="Inline Frame Example"
                  :src="previewUrl"
                />
              </div>
            </div>

          </div>

        </div>
        <div class="content-right">
          <div class="divider" />
          <div class="content-container" style="margin:10px">
            <div class="content-tl">
              <div class="title">
                <span class="vertical-line" />
                <span class="title-text">{{ $t('RT.ru-ku-xin-xi') }}</span>
              </div>
            </div>
            <bx-filter
              ref="filter_three"
              :config="poolConfig"
              :all-edit="true"
              :row="24"
              :show-slide="false"
              label-width="100px"
              @change="threeChange"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="btn-group">
      <el-button v-if="importSteps=='1'" style="float:right;margin-right: 20px" type="primary" @click="submit">{{ $t('RT.ti-jiao') }}</el-button>
      <el-button v-if="importSteps=='2'" style="float:right;margin-right: 20px" type="primary" @click="saveInfo">{{ $t('RT.bao-cun') }}</el-button>
      <el-button style="float:right;margin-right: 20px" @click="cancel">{{ $t('RT.qu-xiao') }}</el-button>
    </div>
  </div>
</template>
<script>
import * as applicantQuery from '@/api/applicant/index.js'
import { uploadBusinessAnnex } from '@/api/common/index'
// import { getDateAge } from '@/components/filterConfig/index.js'
import { getCurrentOrgCode } from '@/utils/getLocal.js'
import config from '@/base_config.js'

export default {
  name: 'ImportResumeDialog',
  data() {
    const _self = this
    return {
      list: [],
      refGroup: [],
      formLoading: false,
      groupData: {},
      dynamicForm: [],
      // BasicInformation: [],
      // JobIntention: [],
      // Education_experience: [],
      // WorkExperience: [],
      // ProjectExperience: [],
      // AcquiredGlories: [],
      // TrainingExperience: [],
      // LanguageAbility: [],
      // Title: [],
      // FamilyMembers: [],
      // RelationalSurveys: [],
      // SelfEvaluation: [],
      // ContactInfo: [],

      userInfoForm: {
      },
      tempFileList: [{ name: 'ceshi-pdf', type: 'pdf' }, { name: 'ceshi-word', type: 'word' }],
      fileList: [
      ],
      resumeData: [],
      uploaded: false,
      uploadBusinessId: '',
      busCode: '',
      docId: '',
      previewUrl: '',
      loading: false,
      stage: 1,
      checkedList: [],
      orgCode: '',
      pages: {
        currentPage: 1,
        pageSize: 20
      },
      temp: true,
      acceptTypes: '.pdf, .doc, .docx',
      importSteps: '1', // 简历导入步骤 1-导入 2-解析
      activeTab: '2', // 1-原始简历 2-标准简历
      uploadConfig: [
        {
          type: 'select',
          key: 'positionId',
          span: 8,
          props: {
            label: '招聘职位:',
            data: {
              type: 'post',
              propsKey: { value: 'guid', label: 'positionName' },
              url: applicantQuery.getPositionList,
              param: function() {
                const param = {
                  currentPage: -1,
                  pageSize: -1,
                  object: {
                    currentOrgCode: _self.orgCode,
                    status: 1
                  }
                }
                return param
              },
              format: function(res) {
                return res.data.records
              }
            },
            required: true,
            validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          }
        },
        {
          type: 'select',
          key: 'lineCode',
          span: 8,
          props: {
            label: '流程节点:',
            data: {
              type: 'data',
              options: [
                { label: this.$t('RT.chu-shai'), value: 'AB001' },
                { label: this.$t('RT.jian-li-ping-gu'), value: 'AB002' },
                { label: this.$t('RT.mian-shi'), value: 'AB003' },
                { label: this.$t('RT.lu-yong'), value: 'AB004' }
              ]
            },
            required: true,
            validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          }
        },
        {
          type: 'cascader',
          key: 'channelId',
          span: 8,
          props: {
            label: '招聘渠道:',
            required: true,
            checkStrictly: true,
            data: {
              type: 'ajax',
              callBack: function(that, fmt) {
                _self.$http
                  .post(applicantQuery.getChannelList, {})
                  .then((res) => {
                    that.propsKey = { value: 'channelCode', label: 'channelName', children: 'channeList' }
                    that.options = fmt(res.data, 'channeList') || []
                    _self.list = res.data
                  })
              }
            },
            validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          }
        },
        {
          type: 'custom',
          slot: 'upload',
          span: 24,
          props: {
            heightAuto: true,
            label: '上传简历:',
            required: true,
            validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          }
        }
      ],
      userInfoConfig: [],
      poolConfig: [
        {
          type: 'select',
          key: 'positionId',
          span: 24,
          props: {
            label: '招聘职位:',
            data: {
              type: 'post',
              propsKey: { value: 'guid', label: 'positionName' },
              url: applicantQuery.getPositionList,
              param: function() {
                const param = {
                  currentPage: -1,
                  pageSize: -1,
                  object: {
                    currentOrgCode: _self.orgCode,
                    status: 1
                  }
                }
                return param
              },
              format: function(res) {
                return res.data.records
              }
            },
            required: true,
            validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          }
        },
        {
          type: 'select',
          key: 'lineCode',
          span: 24,
          props: {
            label: '选择流程节点:',
            data: {
              type: 'data',
              options: [
                { label: this.$t('RT.chu-shai'), value: 'AB001' },
                { label: this.$t('RT.jian-li-ping-gu'), value: 'AB002' },
                { label: this.$t('RT.mian-shi'), value: 'AB003' },
                { label: this.$t('RT.lu-yong'), value: 'AB004' }
              ]
            },
            required: true,
            validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          }
        },
        {
          type: 'cascader',
          key: 'channelId',
          span: 24,
          props: {
            label: '招聘渠道:',
            checkStrictly: true,
            data: {
              type: 'ajax',
              callBack: function(that, fmt) {
                _self.$http
                  .post(applicantQuery.getChannelList, {})
                  .then((res) => {
                    that.propsKey = { value: 'channelCode', label: 'channelName', children: 'channeList' }
                    that.options = fmt(res.data, 'channeList') || []
                  })
              }
            },
            required: true,
            validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          }
        }
      ],
      type: '',
      poolTypeCode: '',
      files: [],
      contentLoading: false,
      resumeDataIndex: 0
    }
  },
  watch: {
    // importSteps(n) {
    //   if (n === '2') {

    //   }
    // }
  },
  created() {
    const param = this.$attrs.props?.param
    this.stage = param.stage
    this.checkedList = param.list
    this.type = param.type
    this.poolTypeCode = param.poolTypeCode
    this.orgCode = getCurrentOrgCode()
  },
  mounted() {
    // this.$nextTick(() => {
    // })
  },
  methods: {
    getchannelName(value, data) {
      data.map(k => {
        if (k.channelCode === value) {
          this.channelName = k.channelName
          return
        }

        if (Array.isArray(k.channeList)) {
          this.getchannelName(value, k.channeList)
        }
      })
    },
    threeChange({ key, value }) {
      this.refGroup = []
      this.dynamicForm = []
      if (key === 'channelId') {
        if (Array.isArray(value)) {
          if (value.length > 1) {
            this.getchannelName(value[1], this.list)
          } else if (value.length === 1) {
            this.getchannelName(value[0], this.list)
          }
        } else {
          this.getchannelName(value, this.list)
        }
      }
      if (key === 'positionId') {
        if (this.fileList.length > 1) {
          this.getUserInfoForm(value)
          this.batchRecognition(value)
        } else {
          this.getUserInfoForm(value)
          this.requestAnalyze(value)
        }
      }
    },
    onExceed() {
      this.$message.warning(this.$t('RT.zui-duo-zhi-neng-shang-chuan-san-ge-wen-jian'))
    },
    tempbtn() {
      this.importSteps === '1' ? this.importSteps = '2' : this.importSteps = '1'
    },
    tabChange() {
      this.activeTab === '1' ? this.activeTab = '2' : this.activeTab = '1'
    },
    queryChannelList() {
      const param = {}
      this.$http
        .post(applicantQuery.getChannelList, param)
        .then((res) => {

        })
    },
    uploadVerification() {
      return new Promise((resolve) => {
        this.$refs.filter_one.allVerification().then(res => {
          resolve(res)
        })
      })
    },
    poolVerification() {
      return new Promise((resolve) => {
        this.$refs.filter_three.allVerification().then(res => {
          resolve(res)
        })
      })
    },
    userInfoVerification() {
      const arr = this.refGroup.map(i => {
        return new Promise((resolve) => {
          this.$refs[i]['0'].allVerification().then(res => {
            resolve(res)
          })
        })
      })
      return Promise.all(arr).then(results => {
        const allTrue = results.every(result => result === true)
        return allTrue
      })
    },
    preview() {
      this.$http
        .get(applicantQuery.previewResume + `?docId=${this.docId}`)
        .then((res) => {
          this.previewUrl = config.query_preview + res.data
        })
    },
    requestUploadAndAnalyze(data) {

    },
    requestUpload(data) {
      const { file } = data
      const allowedExtensions = ['pdf', 'doc', 'docx']
      const fileExtension = file.name.split('.').pop().toLowerCase()
      const isLt10M = file.size / 1024 / 1024 <= 10
      if (!allowedExtensions.includes(fileExtension)) {
        this.$message.error('上传简历只能是 PDF、DOC、DOCX 格式!')
        return false
      }
      if (!isLt10M) {
        this.$message.error('上传简历大小不能超过 10MB!')
        return false
      }

      const arr = data
      this.loading = true
      const temp = {
        businessCode: 'deliveryResume'
      }
      const param = new FormData()
      Object.keys(temp).forEach((key) => {
        param.append(key, temp[key])
      })
      data.file && param.append('multipartFiles', data.file)
      data = param
      this.$http({
        url: uploadBusinessAnnex,
        method: 'post',
        data,
        type: 'upload'
      }).then((res) => {
        if (res.isSuccess) {
          this.files.push(arr.file)
          this.uploaded = true
          this.uploadBusinessId = res.data[0].businessId
          this.docId = res.data[0].docId
          this.fileList.push({
            name: res.data[0].annexName,
            type: res.data[0].annexSuffix,
            url: res.data[0].downloadUrl,
            businessAnnexId: res.data[0].businessAnnexId,
            ...res.data[0]
          })
          this.preview() // 获取预览链接
        } else {
          this.$message.warning(res.message)
        }
        this.loading = false
      })
    },
    requestAnalyze(posId) {
      // this.loading = true
      // const posId = this.$refs.filter_one.getItem('positionId')
      const temp = { positionGuid: posId }
      const param = new FormData() // 创建form对象
      Object.keys(temp).forEach((key) => {
        param.append(key, temp[key])
      })
      this.files && param.append('file', this.files[0])
      this.contentLoading = true
      this.$http({
        url: applicantQuery.importResumes,
        method: 'post',
        data: param,
        type: 'upload'
      }).then((res) => {
        if (res.isSuccess) {
          this.contentLoading = false
          this.userInfoForm = res.data
          this.importSteps = '2'
          this.$nextTick(() => {
            // this.$refs.filter_two.setAllValue(this.userInfoForm)
            this.refGroup.forEach(i => {
              this.$refs[i]['0'].reset()
              this.$refs[i]['0'].setAllValue(this.userInfoForm)
            })
          })
        } else {
          this.$message.warning(res.message)
        }
      }).finally(() => {
        this.contentLoading = false
      })
      // this.loading = false
    },
    async submit() {
      const verified = await this.uploadVerification()
      if (!this.uploaded) {
        this.$message({
          message: this.$t('RT.qing-zhi-shao-shang-chuan-yi-fen-jian-li'),
          type: 'warning'
        })
      }
      const poolParam = this.$refs.filter_one.getAllItem()
      if (verified && this.uploaded) {
        this.importSteps = '2'
        // this.getUserInfoForm(poolParam.positionId)
        this.$nextTick(() => {
          console.log(poolParam.channelId, 'poolParam.channelIdpoolParam.channelId')
          if (poolParam.channelId.length > 1) {
            poolParam.channelId = poolParam.channelId[1]
            // const positionInfoParam = this.$refs['positionInfo'].getFilterValues(1)
          } else {
            poolParam.channelId = poolParam.channelId[0]
          }
          this.$refs.filter_three.setAllValue(poolParam)
          if (this.fileList.length > 1) {
            this.docId = this.fileList[0].docId
            // this.batchRecognition(poolParam.positionId)
          } else {
            this.docId = this.fileList[0].docId
            // this.requestAnalyze(poolParam.positionId)
          }
        })
      }
    },
    // 对应职位表单
    getUserInfoForm(positionId) {
      this.formLoading = true
      this.refGroup = []
      this.$http({
        url: applicantQuery.getFormFieldByPositionId,
        method: 'post',
        data: {
          positionId
        }
      }).then(res => {
        if (res && res.isSuccess) {
          this.dynamicForm = res.data
          res.data.forEach(k => {
            if (k.fieldSelfList.length !== 0) {
              if (k.groupNameEn) {
                this.refGroup.push(k.groupNameEn)
                const configData = k.fieldSelfList.map(i => {
                  if (i.editStyle === '1') {
                    const arr = {
                      type: 'input',
                      key: i.columnName,
                      span: 12,
                      props: {
                        labelsuffix: i.waterMark,
                        label: `${i.fieldName}:`,
                        required: i.isRequired === '1',
                        validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
                      }
                    }
                    if (!i.waterMark) {
                      delete arr.props.labelsuffix
                    }
                    if (i.isRequired !== '1') {
                      delete arr.props.required
                      delete arr.props.validator
                    }
                    return arr
                  } else if (i.editStyle === '2') {
                    const arr = {
                      type: 'select',
                      key: i.columnName,
                      span: 12,
                      props: {
                        labelsuffix: i.waterMark,
                        label: `${i.fieldName}:`,
                        data: {
                          type: 'post',
                          propsKey: {
                            value: 'itemCode',
                            label: 'itemChsCode'
                          },
                          url: applicantQuery.getDataListByCacheArgs,
                          param: function() {
                            const formData = new FormData()
                            const param = {
                              codesetCode: [
                                i.dataSource
                              ]
                            }
                            Object.keys(param).forEach((key) => {
                              formData.append(key, param[key])
                            })
                            return formData
                          },
                          format: function(res) {
                            return res.data
                          }
                        },
                        required: i.isRequired === '1',
                        validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
                      }
                    }
                    if (!i.waterMark) {
                      delete arr.props.labelsuffix
                    }
                    if (i.isRequired !== '1') {
                      delete arr.props.required
                      delete arr.props.validator
                    }
                    return arr
                  } else if (i.editStyle === '3') {
                    const arr = {
                      type: 'select',
                      key: i.columnName,
                      span: 12,
                      props: {
                        labelsuffix: i.waterMark,
                        filterable: true,
                        multiple: true,
                        label: `${i.fieldName}:`,
                        data: {
                          type: 'post',
                          propsKey: {
                            value: 'itemCode',
                            label: 'itemChsCode'
                          },
                          url: applicantQuery.getDataListByCacheArgs,
                          param: function() {
                            const formData = new FormData()
                            const param = {
                              codesetCode: [
                                i.dataSource
                              ]
                            }
                            Object.keys(param).forEach((key) => {
                              formData.append(key, param[key])
                            })
                            return formData
                          },
                          format: function(res) {
                            return res.data
                          }
                        },
                        required: i.isRequired === '1',
                        validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
                      }
                    }
                    if (!i.waterMark) {
                      delete arr.props.labelsuffix
                    }
                    if (i.isRequired !== '1') {
                      delete arr.props.required
                      delete arr.props.validator
                    }
                    return arr
                  } else if (i.editStyle === '4') {
                    const arr = {
                      type: 'radio',
                      key: i.columnName,
                      span: 12,
                      props: {
                        labelsuffix: i.waterMark,
                        label: `${i.fieldName}:`,
                        data: {
                          type: 'post',
                          propsKey: {
                            value: 'itemCode',
                            label: 'itemChsCode'
                          },
                          url: applicantQuery.getDataListByCacheArgs,
                          param: function() {
                            const formData = new FormData()
                            const param = {
                              codesetCode: [
                                i.dataSource
                              ]
                            }
                            Object.keys(param).forEach((key) => {
                              formData.append(key, param[key])
                            })
                            return formData
                          },
                          format: function(res) {
                            return res.data
                          }
                        },
                        required: i.isRequired === '1',
                        validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
                      }
                    }
                    if (!i.waterMark) {
                      delete arr.props.labelsuffix
                    }
                    if (i.isRequired !== '1') {
                      delete arr.props.required
                      delete arr.props.validator
                    }
                    return arr
                  } else if (i.editStyle === '5') {
                    const arr = {
                      type: 'checkbox',
                      key: i.columnName,
                      span: 12,
                      props: {
                        labelsuffix: i.waterMark,
                        label: `${i.fieldName}:`,
                        data: {
                          type: 'post',
                          propsKey: {
                            value: 'itemCode',
                            label: 'itemChsCode'
                          },
                          url: applicantQuery.getDataListByCacheArgs,
                          param: function() {
                            const formData = new FormData()
                            const param = {
                              codesetCode: [
                                i.dataSource
                              ]
                            }
                            Object.keys(param).forEach((key) => {
                              formData.append(key, param[key])
                            })
                            return formData
                          },
                          format: function(res) {
                            return res.data
                          }
                        },
                        required: i.isRequired === '1',
                        validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
                      }
                    }
                    if (!i.waterMark) {
                      delete arr.props.labelsuffix
                    }
                    if (i.isRequired !== '1') {
                      delete arr.props.required
                      delete arr.props.validator
                    }
                    return arr
                  } else if (i.editStyle === '6') {
                    const arr = {
                      type: 'date',
                      key: i.columnName,
                      span: 12,
                      props: {
                        labelsuffix: i.waterMark,
                        label: `${i.fieldName}:`,
                        required: i.isRequired === '1',
                        validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
                      }
                    }
                    if (!i.waterMark) {
                      delete arr.props.labelsuffix
                    }
                    if (i.isRequired !== '1') {
                      delete arr.props.required
                      delete arr.props.validator
                    }

                    return arr
                  } else if (i.editStyle === '7') {
                    console.log(this.$t('RT.yin-yong-shu-ju'))
                  }
                })

                const a = configData.filter(i => {
                  return i !== undefined
                })
                this.groupData[k.groupNameEn] = a
              }

              // })
            }
          })

          this.formLoading = false
          // const configData = res.data.map(item => {
          //   if (item.editStyle === '1') {
          //     const arr = {
          //       type: 'input',
          //       key: item.columnName,
          //       span: 12,
          //       props: {
          //         label: `${item.fieldName}:`,
          //         required: item.isRequired === '1',
          //         validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          //       }
          //     }
          //     return arr
          //   } else if (item.editStyle === '2') {
          //     const arr = {
          //       type: 'select',
          //       key: item.columnName,
          //       span: 12,
          //       props: {
          //         label: `${item.fieldName}:`,
          //         data: {
          //           type: 'post',
          //           propsKey: {
          //             value: 'itemCode',
          //             label: 'itemChsCode'
          //           },
          //           url: applicantQuery.getDataListByCacheArgs,
          //           param: function() {
          //             const formData = new FormData()
          //             const param = {
          //               codesetCode: [
          //                 item.dataSource
          //               ]
          //             }
          //             Object.keys(param).forEach((key) => {
          //               formData.append(key, param[key])
          //             })
          //             return formData
          //           },
          //           format: function(res) {
          //             return res.data
          //           }
          //         },
          //         required: item.isRequired === '1',
          //         validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          //       }
          //     }
          //     return arr
          //   } else if (item.editStyle === '3') {
          //     const arr = {
          //       type: 'select',
          //       key: item.columnName,
          //       span: 12,
          //       props: {
          //         filterable: true,
          //         multiple: true,
          //         label: `${item.fieldName}:`,
          //         data: {
          //           type: 'post',
          //           propsKey: {
          //             value: 'itemCode',
          //             label: 'itemChsCode'
          //           },
          //           url: applicantQuery.getDataListByCacheArgs,
          //           param: function() {
          //             const formData = new FormData()
          //             const param = {
          //               codesetCode: [
          //                 item.dataSource
          //               ]
          //             }
          //             Object.keys(param).forEach((key) => {
          //               formData.append(key, param[key])
          //             })
          //             return formData
          //           },
          //           format: function(res) {
          //             return res.data
          //           }
          //         },
          //         required: item.isRequired === '1',
          //         validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          //       }
          //     }
          //     return arr
          //   } else if (item.editStyle === '4') {
          //     const arr = {
          //       type: 'radio',
          //       key: item.columnName,
          //       span: 12,
          //       props: {
          //         label: `${item.fieldName}:`,
          //         data: {
          //           type: 'post',
          //           propsKey: {
          //             value: 'itemCode',
          //             label: 'itemChsCode'
          //           },
          //           url: applicantQuery.getDataListByCacheArgs,
          //           param: function() {
          //             const formData = new FormData()
          //             const param = {
          //               codesetCode: [
          //                 item.dataSource
          //               ]
          //             }
          //             Object.keys(param).forEach((key) => {
          //               formData.append(key, param[key])
          //             })
          //             return formData
          //           },
          //           format: function(res) {
          //             return res.data
          //           }
          //         },
          //         required: item.isRequired === '1',
          //         validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          //       }
          //     }
          //     return arr
          //   } else if (item.editStyle === '5') {
          //     const arr = {
          //       type: 'checkbox',
          //       key: item.columnName,
          //       span: 12,
          //       props: {
          //         label: `${item.fieldName}:`,
          //         data: {
          //           type: 'post',
          //           propsKey: {
          //             value: 'itemCode',
          //             label: 'itemChsCode'
          //           },
          //           url: applicantQuery.getDataListByCacheArgs,
          //           param: function() {
          //             const formData = new FormData()
          //             const param = {
          //               codesetCode: [
          //                 item.dataSource
          //               ]
          //             }
          //             Object.keys(param).forEach((key) => {
          //               formData.append(key, param[key])
          //             })
          //             return formData
          //           },
          //           format: function(res) {
          //             return res.data
          //           }
          //         },
          //         required: item.isRequired === '1',
          //         validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          //       }
          //     }
          //     return arr
          //   } else if (item.editStyle === '6') {
          //     const arr = {
          //       type: 'date',
          //       key: item.columnName,
          //       span: 12,
          //       props: {
          //         label: `${item.fieldName}:`,
          //         required: item.isRequired === '1',
          //         validator: { text: this.$t('RT.bu-neng-wei-kong'), reg: 'required' }
          //       }
          //     }
          //     return arr
          //   } else if (item.editStyle === '7') {
          //     console.log(this.$t('RT.yin-yong-shu-ju'))
          //   }
          // })

          // const a = configData.filter(i => {
          //   return i !== undefined
          // })
          // this.userInfoConfig = a
          // console.log(a, configData.filter(i => i !== undefined || i !== null || i !== 'undefined'), this.$t('RT.dong-tai-huo-qu-de-shu-ju'))
        }
      }).catch(() => {
        this.formLoading = false
      })
    },
    // 批量解析
    batchRecognition(positionId) {
      const list = {
        positionGuid: positionId
        // positionGuid: '1869711975676776448'
      }
      const param = new FormData()
      Object.keys(list).forEach((key) => {
        param.append(key, list[key])
      })
      this.files.forEach((file) => {
        param.append('files', file) // 将每个文件单独添加
      })
      this.contentLoading = true
      this.$http({
        url: applicantQuery.batchExtract,
        method: 'post',
        data: param,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then((res) => {
        if (res && res.isSuccess) {
          this.$message.success(res.message)
          this.resumeData = res.data
          this.$ref[this.refGroup[0]]['0'].setAllValue(res.data[0])
        } else {
          this.$message.warning(res.message)
        }
      }).finally(() => {
        this.contentLoading = false
      })
    },
    // 点击简历 切换不同识别数据
    resumeDataSelect(index) {
      console.log(this.fileList[index], this.$t('RT.shu-ju'))
      this.docId = this.fileList[index].docId
      this.preview()
      this.resumeDataIndex = index
      this.$nextTick(() => {
        this.refGroup.forEach(i => {
          this.$refs[i]['0'].reset()
          this.$refs[i]['0'].setAllValue(this.resumeData[index])
        })
        // this.$refs.filter_two.reset()
        // this.$refs.filter_two.setAllValue(this.resumeData[index])
        console.log(this.resumeData[index], 'this.resumeData[index]')
      })
    },
    submitAll() {
      this.$bxDialog(
        this.$t('RT.bao-cun'),
        () => import('@/views/applicant/src/components/savePromptBox.vue'),
        {
          data: {
            width: 30
          }
        },
        (data) => {
          if (data === 1) {
            console.log(this.$t('RT.qu-xiao'))
          } else if (data === 2) {
            console.log(this.$t('RT.guan-bi-bao-cun'), '')
            // const userInfoParam = this.$refs['filter_two'].getAllItem()
            // console.log(this.refGroup, ' this.refGroup this.refGroup')
            const userInfoParam = []
            this.refGroup.forEach(i => {
              const rows = this.$refs[i]['0'].getAllItem()
              userInfoParam.push(rows)
            })
            const poolParam = this.$refs['filter_three'].getAllItem()
            poolParam.channelName = this.channelName
            const result = Object.assign({}, ...userInfoParam)
            const param = {
              oldBusinessId: this.uploadBusinessId,
              ...result,
              ...poolParam,
              resumeWorkExpInfoList: [],
              resumeProjectExpInfoList: [],
              resumeLanguageInfoList: [],
              resumeTrainInfoList: [],
              resumeEducationExpInfoList: []
              // peoSource: 'From1'
            }
            if (!this.poolTypeCode) param.peoSource = 'From1'
            else {
              param.poolType = this.poolTypeCode
              if (this.poolTypeCode === 'TP001' || this.poolTypeCode === 'TP002') {
                param.peoSource = 'From2'
              } else {
                param.peoSource = 'From3'
              }
            }
            this.$http
              .post(applicantQuery.addApplicant, param)
              .then((res) => {
                console.log('导入简历保存 submit: ', res)
                this.$emit('bxDialogClose', '1')
              })
              .catch(() => {
                this.$message.error(this.$t('RT.bao-cun-hou-xuan-ren-shi-bai'))
              })
          } else if (data === 3) {
            if (this.resumeDataIndex + 1 === this.fileList.length) {
              this.$message.warning(this.$t('RT.yi-jing-shi-zui-hou-yi-tiao-jian-li'))
            } else if (this.resumeDataIndex + 1 < this.fileList.length) {
              this.$nextTick(() => {
                this.resumeDataIndex++
                this.refGroup.forEach(i => {
                  this.$refs[i]['0'].reset()
                  this.$refs[i]['0'].setAllValue(this.resumeData[this.resumeDataIndex])
                })
                // this.$refs.filter_two.reset()
                // this.$refs.filter_two.setAllValue(this.resumeData[this.resumeDataIndex])
              })
            }
          }
        }

      )
    },
    async saveInfo() {
      const arr = []
      arr.push(this.poolVerification())
      arr.push(this.userInfoVerification())
      // return
      Promise.all(arr).then(res => {
        console.log(this.$t('RT.jian-li-dao-ru'), res)
        if (res[0] && res[1]) {
          this.submitAll()
        }
      })
    },
    cancel() {
      this.$emit('bxDialogClose', '0')
    },
    addApplicant() {
      if (this.type === 'talentPool') {
        this.$bxDialog(
          this.$t('RT.tian-jia-ren-cai'),
          () => import('@/views/talentPool/src/addApplicantDialog.vue'),
          {
            data: {
              width: 70
            },
            param: { poolTypeCode: this.poolTypeCode }
          },
          () => {
            this.$emit('bxDialogClose')
          }
        )
      } else {
        this.$emit('bxDialogClose')
        this.$router.push('/applicant/addApplicant')
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.activeFile{
  background: #2b78ff21;
  border:1px solid #2b78ff6e !important;
  border-radius: 2px;
}
.import-resume {
  display: flex;
  flex-direction: column;
}
.text {
  padding: 0 24px;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 14px;
  color: #262626;
  line-height: 22px;
  text-align: left;
  font-style: normal;
  }
.text {
  padding: 0 24px;
}
.click {
  color: #016AFE;
  cursor: pointer;
}
.upload-container {
  // display: flex;
}
.upload-left {
  width: 150px;
  height: 150px;
}
.upload-right {
  flex:1;
  padding: 10px;
}
.upload-prompt {
  font-family: PingFang SC, PingFang SC;
  font-weight: 400;
  font-size: 12px;
  color: #8C8C8C;
  line-height: 20px;
  text-align: center;
  font-style: normal;
  text-transform: none;
  }
  .header {
    display: flex;
    justify-content: center; /* 使子元素水平居中 */
    align-items: center; /* 在这个上下文中不是必需的，因为子元素已经是垂直居中的（如果内容高度一致） */
    flex-wrap: nowrap; /* 防止子元素换行 */
    margin: 10px auto 14px;
  }
  .item {
    display: flex;
    align-items: center; /* 使圆和文字垂直居中 */
    margin: 0 10px; /* 子元素之间的间距 */
}
.circle {
    width: 26px;
    height: 26px;
    background-color: #CCCCCC;
    border-radius: 50%;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    font-weight: bold;
}
.active{
  background-color: #2B78FF;
}
.activetab{
  background-color: #016AFE !important;
  color: #fff !important;
}
.process-text {
    margin-left: 5px; /* 圆和文字之间的间距 */
    font-size: 16px;
    color: #333;
}
  .line {
    width: 87px;
    height: 0px;
    border: 1px solid #DCDEE0;
  }
  .top {
    height: 80px;
  }
.top-item {
  float: left;
  width: 80px;
  height: 80px;
  border: 1px solid #E9E9E9;
  cursor: pointer;
  margin-right: 10px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .file{
    width: 100%;
    cursor:default;
  & .file-name{
  margin-top: 6px;
  width: 55px;
  overflow: hidden !important;
  white-space: nowrap !important;
  text-overflow: ellipsis !important;
  }
  }

}
.content {
  width: 100%;
  height: 100%;
  padding: 10px;
  margin-top:16px;
  display: flex;
}
.content-left {
  flex: 2;
  border: 1px solid #E9E9E9;
}
.preview {
  padding:10px;
  width: 100%;
  height: 400px;
}
.previewFrame{
  width: 100%;
  height:100%;
}
.content-right {
  flex:1;
}
.content-tabs {

}
.content-container {
  display: flex;
  flex-direction: column;
}
.c-tab {
  width: 90px;
  height: 32px;
  margin: 10px;

  float: left;

  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: 400;
  font-size: 14px;

  background: #EFF2FD;
  color: #333333;
}

  .divider {
    width: 100%;
    height: 0px;
    border: 1px solid #E9E9E9;
  }
  .title{
    float: left;
    margin-left: 6px;
    display: flex;
    justify-content: center;

  }
  .title-text{
    font-weight: 600;
    font-size: 16px;
    color: #262626;
    font-style: normal;
    margin-left: 8px;
  }
  .vertical-line {
      width: 3px;
      height: 16px;
      background-color: #016AFE;
      display: inline-block;
      border-radius: 3px;
  }
::v-deep .el-upload-dragger {
  // width: 150px !important;
  // height: 150px !important;
  background-color: #F7F8FA !important;
}
</style>
