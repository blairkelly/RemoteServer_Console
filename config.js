var config = {}

//local is the machine the user is editing on
//remote is the machine running the server

//Local editing machine's Grunt Script will listen to the following port
config.localmachinegruntport = 3000;
//Remote machine listens to the following port:
config.remotemachinelisteningport = 3500;

config.bpl = "../test_local";  	//base path
config.bpr = "../test_remote";		//base path remote, if different from local

var nsp = "*."; 				//no sub-paths
var asp = "**/*."; 				//all subpaths
var sp_flag = nsp;				//sub path or no sub path flag

var watch_basepath = true;		//watch for files in the basepath?

var textual_files = [
					'html', 
					'css', 
					'cshtml',
					'php', 
					'js', 
					'cs',
					'xml',
					'config',
					'bat',
					'txt',
					'csproj',
					'user',
					'shtml'
				];

config.where_to_watch_including_subpaths = [
						"subpaths"
						];
config.where_to_watch_excluding_subpaths = [
						"no_subpaths"
						];

config.filestowatch = new Array();
var ftw_entry = "";

if(watch_basepath) {
	//add textual files to watch list
	sp_flag = nsp; //set sup path flag to no sub paths.
	for(var i=0; i<textual_files.length; i++) {
		ftw_entry = '/'+sp_flag+textual_files[i];
		config.filestowatch.push(ftw_entry);
	}
}

//needed to export
module.exports = config;