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
var pdata = {current:'A', states:['A', 'D', 'C', 'W', 'P', 'E']};
$.extend({'alert': function(msg){
  $('#msg').text(msg).show();
},
'unalert': function(){
  $('#msg').hide();
}});
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
    var urls = $.trim($('#create textarea[name="url"]').val());
    if (!urls) {
      $.alert('Please input the urls');
      setTimeout(function(){
        $.unalert();
      }, 5000);
      close_create_dialog();
      return;
    }
    var headers = $('#create textarea[name="headers"]').val();
    var output = $('#create input[name="filename"]').val();
    var subdir = $('#create input[name="subdir"]').val();
    var immediately = $('#create input[name="immediately"]').attr('checked') == 'checked';
    urls = urls.split('\n');
    if (urls.length > 1)
      output = "";
    for (var i in urls) {
      var url = urls[i];
      var parts = url.split('\t');
      console.log(parts);
      if (parts.length > 1) {
        url = parts[0];
        output = parts[1];
      }
      var options = {options:{url:url, headers:headers, output:output, subdir:subdir, immediately:immediately}};
      api('create', options);
    }
    close_create_dialog();
    refresh();
  });
  $('#toolbar button.pause').click(function(){
    var ids = [];
    $('#list input[type="checkbox"]:checked').each(function(i){
      ids.push($(this).val());
    });
    pause(ids);
  });
  $('#toolbar button.remove').click(function(){
    var ids = [];
    $('#list input[type="checkbox"]:checked').each(function(i){
      ids.push($(this).val());
    });
    remove(ids);
  });
  $('#toolbar button.resume').click(function(){
    var ids = [];
    $('#list input[type="checkbox"]:checked').each(function(i){
      ids.push($(this).val());
    });
    resume(ids);
  });
  $('#create button.cancel').click(close_create_dialog);
  $('#list td.filename').live('click', function(){
    if($(this).parent().next().css('display') != 'none') {
      $(this).parent().next().hide('fast');
    }else{
      $(this).parent().next().show('fast');
    }
  });
  $('#list thead td').click(function(){
    //
  });
  $('#list th.select').click(function(){
    if($(this).find('select').length)
      return;
    var selector  = $('<select>'
                      + '<option value="A">All</option>'
                      + '<option value="D">D</option>'
                      + '<option value="C">C</option>'
                      + '<option value="P">P</option>'
                      + '<option value="W">W</option>'
                      + '<option value="E">E</option>'
                      + '<option value="N">None</option>'
                    + '</select>');
    $('#list td input[type="checkbox"]').attr('checked', 'checked');
    var td = $(this);
    selector.change(function(){
      var selected = $(this).val();
      if (selected == 'A')
        $('#list td input[type="checkbox"]').attr('checked', 'checked');
      else if (selected == 'N')
        $('#list td input[type="checkbox"]').removeAttr('checked');
      else{
        $('#list td input[type="checkbox"]').removeAttr('checked');
        $('#list tr.%s'.fs(selected)).find('td input[type="checkbox"]').attr('checked', 'checked');
      }
      td.html('Select');
    });
    $(this).html('').append(selector);
    return true;
  });
  $('#list td.select').live('click', function() {
    var selector = $(this).find('input');
    if (selector.attr('checked'))
      selector.removeAttr('checked');
    else
      selector.attr('checked', 'checked');
  });
  $('#list td.select input').live('click', function(event) {
    event.stopPropagation()
  });
  $(window).resize(function(){
    reset_progress_length();
  });
  $('#states span').click(function(){
    $('#states span').removeClass('current');
    var cssClass = $(this).attr('class');
    $(this).addClass('current');
    pdata.current = cssClass;
    $('#list tbody tr').each(function(){
      var cc = $(this).attr('class');
      for (var i in pdata.states) {
        var s = pdata.states[i];
        if ($.inArray(s, cc.split(' '))>=0) {
          if (cssClass == 'A' || s == cssClass) {
            $(this).show();
          } else {
            $(this).hide();
          }
          break;
        }
      }
    });
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
      var errmsg_title = states[task.state] == 'E' ? 'title="%s"'.fs(task.errmsg) : '';
      if (states[task.state] == 'C')
          var tr = '<tr %s class="%s C completed %s>'.fs(errmsg_title, i % 2 ? 'odd' : 'even', pdata.current!='C' && pdata.current!='A' ? 'hidden' : '');
      else if (states[task.state] == 'D')
          var tr = '<tr %s class="%s D downloading %s">'.fs(errmsg_title, i % 2 ? 'odd' : 'even', pdata.current!='D' && pdata.current!='A' ? 'hidden' : '');
      else if (states[task.state] == 'P')
          var tr = '<tr %s class="%s P pause %s">'.fs(errmsg_title, i % 2 ? 'odd' : 'even', pdata.current!='P' && pdata.current!='A' ? 'hidden' : '');
      else if (states[task.state] == 'W')
          var tr = '<tr %s class="%s W waitting %s">'.fs(errmsg_title, i % 2 ? 'odd' : 'even', pdata.current!='W' && pdata.current!='A' ? 'hidden' : '');
      else
          var tr = '<tr %s class="%s E error %s">'.fs(errmsg_title, i % 2 ? 'odd' : 'even', pdata.current!='E' && pdata.current!='A' ? 'hidden' : '');
      if($('#list input[value="%s"]:checked'.fs(task.id)).length) {
        tr += '<td class="center"><input type="checkbox" value="%s" checked></td>'.fs(task.id);
      } else {
        tr += '<td class="center select"><input type="checkbox" value="%s"></td>'.fs(task.id);
      }
      tr += '<td class="center">%s</td>'.fs(task.id);
      tr += '<td class="center state %s">%s</td>'.fs(states[task.state], states[task.state]);
      tr += '<td class="filename">%s</td>'.fs(task.output);
      var total = task.total ? task.total.human() : '';
      if (states[task.state] == 'C')
          var done = total;
      else
          var done = task.done ? task.done.human() : ''
      if (!done && !total)
        tr += '<td class=""></td>';
      else
        tr += '<td class="done"><div percent="%s" class="progress"><span class="filename">%s / %s</span></div></td></td>'.fs(states[task.state] == 'C' ? 1 : task.done/task.total, done, total);
      tr += '<td class="center">%s</td>'.fs(task.subdir);
      //tr += '<td>%s</td>'.fs(task.url);
      if (states[task.state] == 'C')
          speed = '';
      else if (task.speed == 0)
          speed = 0;
      else
          speed = task.speed ? task.speed.human() : '';
      tr += '<td class="center">%s</td>'.fs(speed);
      if (states[task.state] == 'C')
          left = '';
      else
          left = task.left !== null ? task.left.time() : '';
      tr += '<td class="center">%s</td>'.fs(left);
      tr += '</tr>';

      if ($('#list tr#url-%s'.fs(task.id)).length && $('#list tr#url-%s'.fs(task.id)).css('display') != 'none')
        tr += '<tr style="display:table-row;" id="url-' + task.id + '" class="url"><td colspan="3"></td><td colspan="6">' + task.url + '</td></tr>';
      else
        tr += '<tr id="url-' + task.id + '" class="url"><td colspan="3"></td><td colspan="5">' + task.url + '</td></tr>';
      trs += tr;
    });
    $('#wrap table tbody').html(trs);
    reset_progress_length();
  });
}

function reset_progress_length(){
  $('#list .progress').width(0).each(function(i){
    var percent = $(this).attr('percent');
    var width = $(this).parent().width();
    $(this).width(width * percent);
    $(this).find('span.filename').width(width);
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
