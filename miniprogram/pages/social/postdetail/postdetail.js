const util = require('../../../utils/util.js');  
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    contentLoaded: false,
    imagesLoaded: false,
    commentLoaded: false,
    detail: {},
    imageUrls: [],
    inputBoxShow: true,
    maxContentLength: 300,
    comment: '',
    comments: [],
    postid: '',
    comment_value: ''
  },
  refreshComment: function(postid){
    var that = this
    wx.cloud.callFunction({
      name: 'get_comments_for_post',
      data: {
        postid: postid,
      },
      success: function (res) {
        console.log(res.result.comment_list.data)
        var commentList = res.result.comment_list.data
        for (let i = 0; i < commentList.length; i++) {
          commentList[i].time = util.formatTime(new Date(commentList[i].time))
        }
        that.setData({
          comments: res.result.comment_list.data,
          commentLoaded: true
        })
        that.checkLoadFinish()
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中',
    })
    console.log(options)
    var that = this
    this.data.postid = options.postid
    console.log(this.data.postid)
    // 更新浏览次数，TODO本地如何及时同步
    wx.cloud.callFunction({
      name: 'update_watch_count',
      data: {
        postid: options.postid
      },
      success: function (res) {
        console.log('更新成功')
        // console.log(postid)
      }
    })

    // 获取内容
    wx.cloud.callFunction({
      // 云函数名称 
      name: 'get_posts_detail',
      data: {
        postid: options.postid
      },
      success: function (res) {
        console.log(res.result)
        // console.log(res.result.num)
        var postdetail = res.result.postdetail.data[0];
        postdetail.publish_time = util.formatTime(new Date(postdetail.publish_time))
        that.setData({
          detail: postdetail,
          contentLoaded: true
        })
        that.downloadImages(postdetail.image_url)
      },
      fail: console.error
    })
    this.setData({
      postid: options.postid
    })

    // 获取评论
    this.refreshComment(options.postid)
  },
  /**
   * 从数据库获取图片的fileId，然后去云存储下载，最后加载出来
   */
  downloadImages: function(image_urls){
    var that = this
    if(image_urls.length == 0){
      that.setData({
        imageUrls: [],
        imagesLoaded: true
      })
    } else {
      var urls = []
      for(let i = 0; i < image_urls.length; i++) {
        wx.cloud.downloadFile({
          fileID: image_urls[i],
          success: res => {
            // get temp file path
            console.log(res.tempFilePath)
            urls.push(res.tempFilePath)
            if (urls.length == image_urls.length) {
              console.log(urls)
              that.setData({
                imageUrls: urls,
                imagesLoaded: true
              })
              this.checkLoadFinish()
            }
          },
          fail: err => {
            // handle error
          }
        })
      }
    }
    this.checkLoadFinish()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {


  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  sendComment: function() {
    var that = this
    console.log(this.data.comment)
    if (this.data.comment.length < 1) {
      wx.showToast({
        image: '../../../images/warn.png',
        title: '评论不能为空',
      })
      return
    }
    wx.showLoading({
      title: '发布中',
    })
    console.log(this.data.detail._id)
    console.log(app.globalData.openId)
    console.log(app.globalData.wechatNickName)
    console.log(app.globalData.wechatAvatarUrl)
    console.log(this.data.comment)
    wx.cloud.callFunction({
      // 云函数名称 
      name: 'add_comments',
      data: {
        postid: this.data.detail._id,
        // openid: app.globalData.openId,
        name: app.globalData.wechatNickName,
        avatarUrl: app.globalData.wechatAvatarUrl,
        content: this.data.comment
      },
      success: function (res) {
        wx.hideLoading()
        that.refreshComment(that.data.postid)
        that.setData({
          comment_value: ''
        })
      }
    })
  },

  input: function (e) {//就是this.deta.comment_value应该
    // console.log(e.data.value)
    if (e.detail.value.length >= this.data.maxContentLength) {
      wx.showToast({
        title: '已达到最大字数限制',
      })
    }
    this.setData({
      comment: e.detail.value
    })
    console.log(this.comment)
  },
  checkLoadFinish: function() {
    if (this.data.contentLoaded
          && this.data.imagesLoaded
          && this.data.commentLoaded){
      wx.hideLoading()
    }
  }

})
