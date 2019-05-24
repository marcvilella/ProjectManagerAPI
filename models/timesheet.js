// https://stackoverflow.com/questions/3282403/database-schema-for-timesheet

class IProject {
      constructor() {
            this.id = Number;
            this.name = String;
            this.projectId = String;
      }
}

class ISubProject {
      constructor() {
            this.id = Number;
            this.projectId = Number;
            this.name = String;
      }
}

class IWorkSegment {
      constructor() {
            this.id = Number;
            this.subProjectId = Number;
            this.userId = Number;
            this.payrollCycleId = Number;
            this.date = Date;
            this.start = {
                  hours: Number,
                  minutes: Number      
            };
            this.end = {
                  hours: Number,
                  minutes: Number      
            };
            this.total = Number;
            this.comment = String;
      }
}

class ITimeSheet {
      constructor() {
            this.id = Number;
            this.userId = Number;
            this.payrollCycleId = Number;
      }
}

class ITimeSheetSegment {
      constructor() {
            this.id = Number;
            this.subProjectId = Number;
            this.userId = Number;
            this.payrollCycleId = Number;
      }
}

class IApproval {
      constructor() {
            this.id = Number;
            this.timeSheetId = Number;
            this.payrollCycleId = Number;
            this.submitedTime = Date;
            this.approvedBy = Number;
            this.approvedTime = Date;
      }
}

class IPayrollCycle {
      constructor() {
            this.id = Number;
            this.year = Number;
            this.number = Number;
            this.start = Date;
            this.end = Date;
            this.deposit = Date;
            this.check = Date;
            this.total = Number;
      }
}

module.exports = { IProject, ISubProject, IWorkSegment, ITimeSheet, ITimeSheetSegment, IApproval, IPayrollCycle }