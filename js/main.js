String.prototype.fs=function() {
  segments=this.split('%s');
  ret='';
  for (var i in arguments) {
    ret += segments[i] + arguments[i];
  }
  return ret + segments[segments.length-1];
}
String.prototype.trim=function() {
    return this.replace(/^\s+|\s+$/g,"");
}
String.prototype.ltrim=function() {
    return this.replace(/^\s+/,"");
}
String.prototype.rtrim=function() {
    return this.replace(/\s+$/,"");
};
String.prototype.empty=function() {
    return this == '';
};

Number.prototype.human=function() {
    if (this < 1024)
        return this + 'B';
    else if (this < 1024 * 1024)
        return this/1024 + 'KB';
    else if (this < 1024 * 1024 * 1024)
        return this/1024/1024 + 'MB';
    else if (this < 1024 * 1024 * 1024 * 1024)
        return this/1024/1024/1024 + 'GB';
    else
        return this/1024/1024/1024/1024 + 'TB';
}


$(window.webm=function() {
this.api = function(action, data, callback) {
  if (data == undefined)
    data = new Object;
  data['action'] = action;
  $.ajax({
    url:'/api',
    type:'POST',
    data:JSON.stringify(data),
    dataType:'json',
    success:callback,
    error:function(ret){
      console.log(ret);
    }
  });
}

this.init = function() {
  $('#create button.create').click(function(){
    //
  });
  $('#create button.cancel').click(function(){
    //
  });
  $('#list td.url').click(function(){
    //
  });
  $('#list thead td').click(function(){
    //
  });

  this.refresh();
}

this.create_table = function(tasks) {
  var trs = new Array;
  $.each(tasks, function(i) {
    var tr = '<tr>';
    tr += '<td>%s</td>'.fs(task.id);
    tr += '<td>%s</td>'.fs(task.output);
    tr += '<td>%s</td>'.fs(task.total.human());
    tr += '<td>%s</td>'.fs(task.subdir);
    tr += '<td>%s</td>'.fs(task.url);
    tr += '<td>%s</td>'.fs(task.speed);
    tr += '<td>%s</td>'.fs(task.lte);
    tr += '</tr>';
    trs.push(tr);
  });
  trs.join('');
}

this.refresh = function() {
  this.api('tasks', null, function(return_content){
    var tasks = return_content['result'];
    var trs = "";
    $.each(tasks, function(i) {
      var task = tasks[i];
      var tr = '<tr>';
      tr += '<td>%s</td>'.fs(task.id);
      tr += '<td>%s</td>'.fs(task.output);
      tr += '<td>%s</td>'.fs(task.total ? task.total.human() : '');
      tr += '<td>%s</td>'.fs(task.subdir);
      tr += '<td>%s</td>'.fs(task.url);
      tr += '<td>%s</td>'.fs(task.speed);
      tr += '<td>%s</td>'.fs(task.lte);
      tr += '</tr>';
      trs += tr;
    });
    console.log(trs);
    $('#wrap table tbody').html(trs);
  });
}

this.open_create_dialog = function() {
  var $d = $(document);
  var ww = $d.width();
  var wh = $d.height();

  var $c = $('#create');
  var cw = $c.width();
  var ch = $c.height()

  var left = (ww - cw) / 2;
  var top = (wh - ch) / 2;
  if (left < 0)
    left = 0;
  if (top < 0)
    top = 0;
  $c.css({left:left,top:top,display:'block'});

  $('#background').css({display:'block',width:ww,height:wh});
}

this.close_create_dialog = function() {
  $('#create').hide();
  $('#background').hide();
}

this.pause = function(ids) {
  var ret = this.api('pause', {ids:ids});
  if (!ret.success)
    this.alert('Error!')
}

this.remove = function(ids) {
  var ret = this.api('remove', {ids:ids});
  if (!ret.success)
    this.alert('Error!')
}

this.settop = function() {
}

this.setbottom = function() {
}

this.init();
});
