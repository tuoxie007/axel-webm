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
        return parseInt(this) + 'B';
    else if (this < 1024 * 1024)
        return parseInt(this/1024*10)/10 + 'KB';
    else if (this < 1024 * 1024 * 1024)
        return parseInt(this/1024/1024*10)/10 + 'MB';
    else if (this < 1024 * 1024 * 1024 * 1024)
        return parseInt(this/1024/1024/1024*10)/10 + 'GB';
    else
        return parseInt(this/1024/1024/1024/1024*10)/10 + 'TB';
}
Number.prototype.time=function() {
    if (this < 60)
      return this + ' S';
    else if (this < 3600)
      return parseInt(this/60) + ' M';
    else if (this < 3600)
      return parseInt(this/3600) + ' H';
    else
      return parseInt(this/3600/24) + ' D';
}


$(function() {
function api(action, data, callback) {
  if (data == undefined)
    data = new Object;
  data['action'] = action;
  $.ajax({
    url:'/api',
    type:'POST',
    data:JSON.stringify(data),
    dataType:'json',
    success:function(ret) {
      callback(ret);
    },
    error:function(ret){
      console.log(ret);
    }
  });
}

function init() {
  $('#toolbar .create').click(open_create_dialog);
  $('#create button.create').click(function(){
    var urls = $('#create textarea[name="url"]').val();
    var output = $('#create input[name="filename"]').val();
    var subdir = $('#create input[name="subdir"]').val();
    var immediately = $('#create input[name="immediately"]').attr('checked') == 'checked';
    urls = urls.split('\n');
    if (urls.length > 1)
      output = "";
    for (var i in urls) {
      var url = urls[i];
      var options = {options:{url:url, output:output, subdir:subdir, immediately:immediately}};
      api('create', options);
    }
    close_create_dialog();
    refresh();
  });
  $('#toolbar button.pause').click(function(){
    var ids = [];
    $('#list input[type="checkbox"]').each(function(i){
      ids.push($(this).val());
    });
    pause(ids);
  });
  $('#toolbar button.remove').click(function(){
    var ids = [];
    $('#list input[type="checkbox"]').each(function(i){
      ids.push($(this).val());
    });
    remove(ids);
  });
  $('#toolbar button.resume').click(function(){
    var ids = [];
    $('#list input[type="checkbox"]').each(function(i){
      ids.push($(this).val());
    });
    resume(ids);
  });
  $('#create button.cancel').click(close_create_dialog);
  $('#list td.url').click(function(){
    //
  });
  $('#list thead td').click(function(){
    //
  });

  refresh();
  setInterval(refresh, 5000);
}

function refresh() {
  api('tasks', null, function(return_content){
    states = {1:'W', 2:'D', 3:'P', 4:'C', 5:'E'}
    var tasks = return_content['result'];
    var trs = "";
    $.each(tasks, function(i) {
      var task = tasks[i];
      if (states[task.state] == 'C')
          var tr = '<tr class="completed">';
      else if (states[task.state] == 'D')
          var tr = '<tr class="downloading">';
      else if (states[task.state] == 'P')
          var tr = '<tr class="pause">';
      else if (states[task.state] == 'W')
          var tr = '<tr class="waitting">';
      else
          var tr = '<tr>';
      if($('#list input[value="%s"]'.fs(task.id)).length) {
        tr += '<td><input type="checkbox" value="%s" checked></td>'.fs(task.id);
      } else {
        tr += '<td><input type="checkbox" value="%s"></td>'.fs(task.id);
      }
      tr += '<td>%s</td>'.fs(task.id);
      tr += '<td>%s</td>'.fs(states[task.state]);
      tr += '<td>%s</td>'.fs(task.output);
      if (states[task.state] == 'C')
          done = '';
      else
          done = task.done ? task.done.human() : ''
      tr += '<td>%s</td>'.fs(done);
      tr += '<td>%s</td>'.fs(task.total ? task.total.human() : '');
      tr += '<td>%s</td>'.fs(task.subdir);
      //tr += '<td>%s</td>'.fs(task.url);
      if (states[task.state] == 'C')
          speed = '';
      else
          speed = task.speed ? task.speed.human() : '';
      tr += '<td>%s</td>'.fs(speed);
      if (states[task.state] == 'C')
          left = '';
      else
          left = task.left !== null ? task.left.time() : '';
      tr += '<td>%s</td>'.fs(left);
      tr += '</tr>';
      trs += tr;
    });
    console.log(trs);
    $('#wrap table tbody').html(trs);
  });
}

function open_create_dialog() {
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

function close_create_dialog() {
  $('#create').hide();
  $('#background').hide();
}

function pause(ids) {
  api('pause', {ids:ids}, refresh);
}

function remove(ids) {
  api('remove', {ids:ids}, refresh);
}

function resume(ids) {
  api('resume', {ids:ids}, refresh);
}

function settop() {
}

function setbottom () {
}

init();
});
