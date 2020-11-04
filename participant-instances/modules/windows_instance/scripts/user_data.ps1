<powershell>

Set-ExecutionPolicy Bypass -Force;
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'));

choco install vscode -y
choco install git -y
choco install googlechrome -y

refreshenv

net user ${var_instance_username} ‘${var_instance_password}’ /add /y
net localgroup administrators ${var_instance_username} /add

$chromePath = "$${Env:ProgramFiles(x86)}\Google\Chrome\Application\" 
$chromeApp = "chrome.exe"
$chromeCommandArgs = "--make-default-browser"
& "$chromePath$chromeApp" $chromeCommandArgs


Set-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice' -Name ProgId -Value 'ChromeHTML'
Set-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice' -Name ProgId -Value 'ChromeHTML'

mkdir c:\\playground
cd c:\\playground


$initScript = @'

function Disable-InternetExplorerESC {
   $AdminKey = "HKLM:\SOFTWARE\Microsoft\Active Setup\Installed Components\{A509B1A7-37EF-4b3f-8CFC-4F3A74704073}"
   $UserKey = "HKLM:\SOFTWARE\Microsoft\Active Setup\Installed Components\{A509B1A8-37EF-4b3f-8CFC-4F3A74704073}"
   Set-ItemProperty -Path $AdminKey -Name "IsInstalled" -Value 0 -Force
   Set-ItemProperty -Path $UserKey -Name "IsInstalled" -Value 0 -Force
   Rundll32 iesetup.dll, IEHardenLMSettings
   Rundll32 iesetup.dll, IEHardenUser
   Rundll32 iesetup.dll, IEHardenAdmin
   Write-Host "IE Enhanced Security Configuration (ESC) has been disabled."
}

Disable-InternetExplorerESC


cd c:\\playground

${custom_install_script}

Disable-ScheduledTask -TaskName "initScript"

'@
$initScript | Out-File 'c:\\playground\\initscript.ps1'

$taskName = "initScript"
$action = New-ScheduledTaskAction -Execute 'Powershell.exe' `
  -Argument "-NoProfile -File ""c:\\playground\\initscript.ps1"""
$trigger =  New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -Action $action `
    -Trigger $trigger `
    -User ${var_instance_username} `
    -Password '${var_instance_password}' `
    -TaskName $taskName `
    -Description $taskName

Restart-Computer -Force
</powershell>




